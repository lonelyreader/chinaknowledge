import "dotenv/config";

import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
} from "payload";

import config from "@payload-config";
import { requireCMSOperationTarget } from "./cms-operation-target";

type AccountInput = {
  displayName: string;
  email: string;
  role: "author" | "editor";
};

function parseInput(value: unknown): AccountInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Account input must be a non-empty JSON array.");
  }
  const seen = new Set<string>();
  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error(`Entry ${index + 1} must be an object.`);
    const candidate = entry as Record<string, unknown>;
    const email = typeof candidate.email === "string" ? candidate.email.trim().toLowerCase() : "";
    const displayName = typeof candidate.displayName === "string" ? candidate.displayName.trim() : "";
    const role = candidate.role;
    if (!email || !email.includes("@")) throw new Error(`Entry ${index + 1} has an invalid email.`);
    if (!displayName) throw new Error(`Entry ${index + 1} has no displayName.`);
    if (role !== "author" && role !== "editor") {
      throw new Error(`Entry ${index + 1} role must be author or editor.`);
    }
    if (seen.has(email)) throw new Error(`Duplicate input email: ${email}`);
    seen.add(email);
    return { displayName, email, role };
  });
}

const apply = process.argv.includes("--apply");
const sendResetEmail = process.argv.includes("--send-reset-email");
const resendExisting = process.argv.includes("--resend-existing");
const inputArgument = process.argv.find((value) => value.startsWith("--input="));
const inputPath = inputArgument?.slice("--input=".length) || process.env.CMS_ACCOUNT_INPUT;
const operationEnvironment = requireCMSOperationTarget({
  apply,
  productionConfirmation: "PROVISION_CMS_ACCOUNTS_IN_PRODUCTION",
  productionConfirmationVariable: "CMS_ACCOUNT_PRODUCTION_CONFIRM",
});

if (!inputPath) throw new Error("Use --input=/absolute/path/accounts.json or set CMS_ACCOUNT_INPUT.");
if (apply && process.env.CMS_ACCOUNT_PROVISION_CONFIRM !== "PROVISION_CMS_ACCOUNTS") {
  throw new Error("Set CMS_ACCOUNT_PROVISION_CONFIRM=PROVISION_CMS_ACCOUNTS before --apply.");
}
if (sendResetEmail && !apply) throw new Error("--send-reset-email requires --apply.");
if (resendExisting && !sendResetEmail) throw new Error("--resend-existing requires --send-reset-email.");
if (apply && operationEnvironment === "production" && !sendResetEmail) {
  throw new Error("Production account creation requires --send-reset-email.");
}

const absoluteInputPath = path.resolve(inputPath);
const accounts = parseInput(JSON.parse(await readFile(absoluteInputPath, "utf8")) as unknown);
if (accounts.length > 500) throw new Error("A single account batch cannot exceed 500 entries.");

const operatorEmail = process.env.CMS_ACCOUNT_OPERATOR_EMAIL?.trim().toLowerCase();
if (apply && !operatorEmail) throw new Error("CMS_ACCOUNT_OPERATOR_EMAIL is required for --apply.");

let resetBaseURL: string | null = null;
if (sendResetEmail) {
  const value = process.env.CMS_ACCOUNT_RESET_BASE_URL;
  if (!value) throw new Error("CMS_ACCOUNT_RESET_BASE_URL is required when sending reset email.");
  const parsed = new URL(value);
  if (operationEnvironment === "production" && parsed.protocol !== "https:") {
    throw new Error("Production reset email requires an https CMS_ACCOUNT_RESET_BASE_URL.");
  }
  resetBaseURL = parsed.origin;
}

const runID = randomUUID();
const payload = await getPayload({ config });

try {
  if (resetBaseURL) payload.config.serverURL = resetBaseURL;

  const existing = await payload.find({
    collection: "users",
    depth: 0,
    limit: accounts.length,
    overrideAccess: true,
    pagination: false,
    where: { email: { in: accounts.map(({ email }) => email) } },
  });
  const existingByEmail = new Map(existing.docs.map((user) => [user.email.toLowerCase(), user]));
  const create = accounts.filter(({ email }) => !existingByEmail.has(email));
  const skip = accounts.filter(({ email }) => existingByEmail.has(email));
  const conflicts = skip.filter((account) => {
    const user = existingByEmail.get(account.email)!;
    return user.displayName !== account.displayName || user.role !== account.role;
  });
  if (apply && conflicts.length) {
    throw new Error(`Account batch has ${conflicts.length} existing account conflict(s); no writes started.`);
  }

  if (!apply) {
    console.log(JSON.stringify({ apply: false, conflicts: conflicts.length, create: create.length, input: accounts.length, runID, sendResetEmail: false, skipExisting: skip.length }, null, 2));
  } else {
    const created: { email: string; id: number | string; resetEmail: boolean }[] = [];
    const req = await createLocalReq({}, payload);
    if (!(await initTransaction(req))) {
      throw new Error("Account provisioning could not start an isolated database transaction.");
    }
    try {
      const operator = await payload.find({
        collection: "users",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        where: { email: { equals: operatorEmail! } },
      });
      if (operator.docs[0]?.role !== "super_admin") {
        throw new Error("CMS_ACCOUNT_OPERATOR_EMAIL must identify an existing Super Admin.");
      }
      for (const account of create) {
        const password = `${randomBytes(32).toString("base64url")}Aa1!`;
        const user = await payload.create({
          collection: "users",
          data: { ...account, accountStatus: "active", password },
          overrideAccess: true,
          req,
        });
        created.push({ email: account.email, id: user.id, resetEmail: false });
      }
      const readback = await payload.find({
        collection: "users",
        depth: 0,
        limit: accounts.length,
        overrideAccess: true,
        pagination: false,
        req,
        where: { email: { in: accounts.map(({ email }) => email) } },
      });
      const readbackByEmail = new Map(readback.docs.map((user) => [user.email.toLowerCase(), user]));
      const readbackMatches = accounts.every((account) => {
        const user = readbackByEmail.get(account.email);
        return user?.displayName === account.displayName && user.role === account.role;
      });
      if (!readbackMatches) throw new Error("Account batch readback did not match the requested accounts.");
      await commitTransaction(req);
    } catch (error) {
      await killTransaction(req);
      console.error(JSON.stringify({ apply: true, created: 0, input: accounts.length, phase: "account_write", readback: "FAIL", runID }, null, 2));
      throw error;
    }

    const resetTargets = [
      ...(sendResetEmail ? create.map(({ email }) => email) : []),
      ...(resendExisting ? skip.map(({ email }) => email) : []),
    ];
    const resetSent: string[] = [];
    const resetFailed: string[] = [];
    for (const email of resetTargets) {
      try {
        await payload.forgotPassword({
          collection: "users",
          data: { email },
          overrideAccess: true,
        });
        resetSent.push(email);
      } catch {
        resetFailed.push(email);
      }
    }
    for (const record of created) record.resetEmail = resetSent.includes(record.email);

    const summary = {
      apply: true,
      created,
      input: accounts.length,
      operatorEmail,
      readback: "PASS",
      resetFailed,
      resetSent,
      runID,
      skippedExisting: skip.map(({ email }) => email),
    };
    console.log(JSON.stringify(summary, null, 2));
    if (resetFailed.length) {
      throw new Error(`Account writes succeeded, but ${resetFailed.length} reset email(s) failed. Re-run with --resend-existing.`);
    }
  }
} finally {
  await payload.destroy();
}

process.exit(0);
