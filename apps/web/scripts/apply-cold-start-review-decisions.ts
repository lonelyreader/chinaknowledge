import "dotenv/config";

import { randomUUID } from "node:crypto";
import { appendFile, readFile } from "node:fs/promises";
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

const REVIEW_DECISION_VERSION = "ColdStartReviewDecisionV1" as const;

type ReviewDecision = {
  contentHash: string;
  contentKey: string;
  decision: "approved";
  note?: string;
  version: typeof REVIEW_DECISION_VERSION;
};

const apply = process.argv.includes("--apply");
const inputArgument = process.argv.find((value) => value.startsWith("--input="));
const auditArgument = process.argv.find((value) => value.startsWith("--audit="));
const inputPath = inputArgument?.slice("--input=".length) || process.env.COLD_START_REVIEW_INPUT;
const auditPath = auditArgument?.slice("--audit=".length) || process.env.COLD_START_REVIEW_AUDIT;
const actorEmail = process.env.COLD_START_ACTOR_EMAIL?.trim().toLowerCase();
const environment = requireCMSOperationTarget({
  apply,
  productionConfirmation: "APPROVE_COLD_START_MASTERS_IN_PRODUCTION",
  productionConfirmationVariable: "COLD_START_REVIEW_PRODUCTION_CONFIRM",
});

if (!inputPath) throw new Error("Use --input=/absolute/path/review-decisions.jsonl or set COLD_START_REVIEW_INPUT.");
if (apply && environment !== "local" && !actorEmail) {
  throw new Error("COLD_START_ACTOR_EMAIL is required for non-local --apply.");
}
if (apply && process.env.COLD_START_REVIEW_APPLY_CONFIRM !== "APPROVE_COLD_START_MASTERS") {
  throw new Error("Set COLD_START_REVIEW_APPLY_CONFIRM=APPROVE_COLD_START_MASTERS before --apply.");
}

const absoluteInputPath = path.resolve(inputPath);
const decisions = parseDecisions(await readFile(absoluteInputPath, "utf8"));
const payload = await getPayload({ config });
const runID = randomUUID();
const result = {
  apply,
  approved: [] as number[],
  environment,
  input: decisions.length,
  runID,
  skipped: [] as number[],
};

try {
  const actorCandidates = apply
    ? await payload.find({
        collection: "users",
        depth: 0,
        limit: actorEmail ? 1 : 10,
        overrideAccess: true,
        pagination: false,
        where: actorEmail
          ? { and: [{ email: { equals: actorEmail } }, { role: { in: ["editor", "super_admin"] } }, { accountStatus: { equals: "active" } }] }
          : { and: [{ role: { in: ["editor", "super_admin"] } }, { accountStatus: { equals: "active" } }] },
      })
    : null;
  const actor = actorCandidates
    ? [...actorCandidates.docs].sort((left, right) => Number(left.id) - Number(right.id))[0]
    : null;
  if (apply && !actor) throw new Error("COLD_START_ACTOR_EMAIL must identify an active Editor or Super Admin.");

  const masters = await payload.find({
    collection: "editorial-masters",
    depth: 0,
    draft: true,
    limit: decisions.length,
    overrideAccess: true,
    pagination: false,
    where: { contentKey: { in: decisions.map((decision) => decision.contentKey) } },
  });
  if (masters.totalDocs !== decisions.length) {
    throw new Error(`Found ${masters.totalDocs}/${decisions.length} requested Chinese masters.`);
  }
  const masterByKey = new Map(masters.docs.map((master) => [master.contentKey, master]));
  for (const decision of decisions) {
    const master = masterByKey.get(decision.contentKey)!;
    if (master.contentHash !== decision.contentHash) {
      throw new Error(`${decision.contentKey} changed after the review decision was recorded.`);
    }
    if (master.rightsStatus !== "cleared") {
      throw new Error(`${decision.contentKey} does not have cleared source rights.`);
    }
    if (!master.sourceNotes?.length || master.sourceNotes.some((source) =>
      !source.label?.trim() || !source.url?.trim() || !source.checkedAt || source.rights === "restricted")) {
      throw new Error(`${decision.contentKey} has incomplete or restricted source evidence.`);
    }
    if (!["candidate", "in_review", "approved"].includes(master.editorialStatus)) {
      throw new Error(`${decision.contentKey} cannot move from ${master.editorialStatus} to approved.`);
    }
    if (master.editorialStatus === "approved") result.skipped.push(Number(master.id));
  }

  if (apply) {
    const req = await createLocalReq({ user: actor! }, payload);
    if (!(await initTransaction(req))) throw new Error("Review approval could not start a database transaction.");
    try {
      for (const decision of decisions) {
        const master = masterByKey.get(decision.contentKey)!;
        if (master.editorialStatus === "approved") continue;
        const updated = await payload.update({
          collection: "editorial-masters",
          id: master.id,
          data: { editorialStatus: "approved" },
          draft: true,
          overrideAccess: false,
          req,
        });
        result.approved.push(Number(updated.id));
      }
      const readback = await payload.find({
        collection: "editorial-masters",
        depth: 0,
        draft: true,
        limit: decisions.length,
        overrideAccess: true,
        pagination: false,
        req,
        where: { contentKey: { in: decisions.map((decision) => decision.contentKey) } },
      });
      if (readback.totalDocs !== decisions.length || readback.docs.some((master) => master.editorialStatus !== "approved")) {
        throw new Error("Chinese approval readback did not return every requested master as approved.");
      }
      await commitTransaction(req);
    } catch (error) {
      await killTransaction(req);
      throw error;
    }
  }

  const auditRecord = {
    ...result,
    actorEmail: apply ? actor?.email : null,
    completedAt: new Date().toISOString(),
    decisions: decisions.map((decision) => ({
      contentHash: decision.contentHash,
      contentKey: decision.contentKey,
      decision: decision.decision,
      note: decision.note ?? null,
    })),
    inputPath: absoluteInputPath,
    readback: apply ? "PASS" : "NOT_RUN",
  };
  if (auditPath) await appendFile(path.resolve(auditPath), `${JSON.stringify(auditRecord)}\n`, "utf8");
  console.log(JSON.stringify(auditRecord, null, 2));
} finally {
  await payload.destroy();
}

function parseDecisions(raw: string): ReviewDecision[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length || lines.length > 500) throw new Error("Review decisions must contain 1 to 500 entries.");
  const seen = new Set<string>();
  return lines.map((line, index) => {
    let value: unknown;
    try { value = JSON.parse(line); }
    catch { throw new Error(`Review decision line ${index + 1} is not valid JSON.`); }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Review decision line ${index + 1} must be an object.`);
    }
    const decision = value as Partial<ReviewDecision>;
    if (decision.version !== REVIEW_DECISION_VERSION || decision.decision !== "approved") {
      throw new Error(`Review decision line ${index + 1} must be an approved ${REVIEW_DECISION_VERSION}.`);
    }
    if (!decision.contentKey?.trim() || !/^[a-f0-9]{64}$/.test(decision.contentHash ?? "")) {
      throw new Error(`Review decision line ${index + 1} has no valid content key or hash.`);
    }
    if (decision.note !== undefined && (typeof decision.note !== "string" || decision.note.length > 1000)) {
      throw new Error(`Review decision line ${index + 1} has an invalid note.`);
    }
    if (seen.has(decision.contentKey)) throw new Error(`Duplicate review decision: ${decision.contentKey}.`);
    seen.add(decision.contentKey);
    return decision as ReviewDecision;
  });
}

process.exit(0);
