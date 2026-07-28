import "dotenv/config";

import { randomUUID } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type PayloadRequest,
} from "payload";

import config from "@payload-config";
import { requireCMSOperationTarget } from "./cms-operation-target";

const apply = process.argv.includes("--apply");
const email = process.env.CMS_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const displayName = process.env.CMS_BOOTSTRAP_DISPLAY_NAME?.trim();
const password = process.env.CMS_BOOTSTRAP_PASSWORD;
const runID = randomUUID();

requireCMSOperationTarget({
  apply,
  productionConfirmation: "CREATE_FIRST_SUPER_ADMIN_IN_PRODUCTION",
  productionConfirmationVariable: "CMS_BOOTSTRAP_PRODUCTION_CONFIRM",
});

if (!email || !displayName) {
  throw new Error("CMS_BOOTSTRAP_EMAIL and CMS_BOOTSTRAP_DISPLAY_NAME are required.");
}
if (apply && process.env.CMS_BOOTSTRAP_CONFIRM !== "CREATE_FIRST_SUPER_ADMIN") {
  throw new Error("Set CMS_BOOTSTRAP_CONFIRM=CREATE_FIRST_SUPER_ADMIN before --apply.");
}
if (apply && (!password || password.length < 14)) {
  throw new Error("CMS_BOOTSTRAP_PASSWORD must be at least 14 characters for --apply.");
}

const payload = await getPayload({ config });

try {
  if (!apply) {
    const users = await payload.count({ collection: "users", overrideAccess: true });
    if (users.totalDocs !== 0) {
      throw new Error(`Bootstrap refused: users collection already contains ${users.totalDocs} account(s).`);
    }
    console.log(JSON.stringify({ action: "create_first_super_admin", apply: false, displayName, email, runID }, null, 2));
  } else {
    const req = await createLocalReq({}, payload);
    if (!(await initTransaction(req))) {
      throw new Error("Bootstrap could not start an isolated database transaction.");
    }
    try {
      await transactionDB(req).execute(sql`SELECT pg_advisory_xact_lock(4349460101)`);
      const users = await payload.count({ collection: "users", overrideAccess: true, req });
      if (users.totalDocs !== 0) {
        throw new Error(`Bootstrap refused: users collection already contains ${users.totalDocs} account(s).`);
      }
      const created = await payload.create({
        collection: "users",
        data: { displayName, email, password: password!, role: "super_admin" },
        overrideAccess: true,
        req,
      });
      const readback = await payload.findByID({
        collection: "users",
        id: created.id,
        overrideAccess: true,
        req,
      });
      if (readback.email !== email || readback.role !== "super_admin") {
        throw new Error("Bootstrap readback did not match the requested Super Admin.");
      }
      await commitTransaction(req);
      console.log(JSON.stringify({ action: "create_first_super_admin", apply: true, email, id: readback.id, readback: "PASS", runID }, null, 2));
    } catch (error) {
      await killTransaction(req);
      throw error;
    }
  }
} finally {
  await payload.destroy();
}

process.exit(0);

function transactionDB(req: PayloadRequest) {
  const transactionID = req.transactionID;
  if (!transactionID || transactionID instanceof Promise) {
    throw new Error("Bootstrap transaction is not ready.");
  }
  const db = req.payload.db.sessions?.[String(transactionID)]?.db as
    | { execute: (query: unknown) => Promise<unknown> }
    | undefined;
  if (!db) throw new Error("Bootstrap transaction database session is unavailable.");
  return db;
}
