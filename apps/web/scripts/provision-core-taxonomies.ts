import "dotenv/config";

import { randomUUID } from "node:crypto";
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
} from "payload";

import config from "@payload-config";
import { requireCMSOperationTarget } from "./cms-operation-target";

const purposes = [
  { name: "Understand", slug: "understand" },
  { name: "Visit", slug: "visit" },
  { name: "Live", slug: "live" },
  { name: "Study", slug: "study" },
  { name: "Work", slug: "work" },
  { name: "Business", slug: "business" },
] as const;

const apply = process.argv.includes("--apply");
const environment = requireCMSOperationTarget({
  apply,
  productionConfirmation: "PROVISION_CORE_TAXONOMIES_IN_PRODUCTION",
  productionConfirmationVariable: "CORE_TAXONOMY_PRODUCTION_CONFIRM",
});
if (apply && process.env.CORE_TAXONOMY_APPLY_CONFIRM !== "PROVISION_CORE_TAXONOMIES") {
  throw new Error("Set CORE_TAXONOMY_APPLY_CONFIRM=PROVISION_CORE_TAXONOMIES before --apply.");
}

const payload = await getPayload({ config });
const runID = randomUUID();

try {
  const existing = await payload.find({
    collection: "taxonomies",
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: { dimension: { equals: "purpose" } },
  });
  const bySlug = Object.groupBy(existing.docs, (taxonomy) => taxonomy.slug);
  const duplicates = Object.entries(bySlug)
    .filter(([, values]) => (values?.length ?? 0) > 1)
    .map(([slug]) => slug);
  if (duplicates.length) throw new Error(`Duplicate purpose taxonomies exist: ${duplicates.join(", ")}`);

  const missing = purposes.filter((purpose) => !bySlug[purpose.slug]);
  if (!apply) {
    console.log(JSON.stringify({
      action: "provision_core_taxonomies",
      apply: false,
      environment,
      existing: purposes.filter((purpose) => bySlug[purpose.slug]).map((purpose) => purpose.slug),
      missing: missing.map((purpose) => purpose.slug),
      runID,
    }, null, 2));
  } else {
    const configuredEmail = process.env.CORE_TAXONOMY_ACTOR_EMAIL?.trim().toLowerCase();
    const admins = await payload.find({
      collection: "users",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      where: configuredEmail
        ? { and: [{ email: { equals: configuredEmail } }, { role: { equals: "super_admin" } }, { accountStatus: { equals: "active" } }] }
        : { and: [{ role: { equals: "super_admin" } }, { accountStatus: { equals: "active" } }] },
    });
    if (admins.totalDocs !== 1 && (configuredEmail || environment !== "local" || admins.totalDocs === 0)) {
      throw new Error(configuredEmail
        ? "CORE_TAXONOMY_ACTOR_EMAIL must identify exactly one active Super Admin."
        : `Set CORE_TAXONOMY_ACTOR_EMAIL when the target has zero or multiple active Super Admins (found ${admins.totalDocs}).`);
    }
    const actor = [...admins.docs].sort((left, right) => Number(left.id) - Number(right.id))[0]!;
    const req = await createLocalReq({ user: actor }, payload);
    if (!(await initTransaction(req))) throw new Error("Taxonomy provisioning could not start a database transaction.");
    const created: number[] = [];
    try {
      for (const purpose of missing) {
        const taxonomy = await payload.create({
          collection: "taxonomies",
          data: { dimension: "purpose", name: purpose.name, slug: purpose.slug },
          overrideAccess: false,
          req,
        });
        created.push(taxonomy.id);
      }
      const readback = await payload.find({
        collection: "taxonomies",
        depth: 0,
        limit: 100,
        overrideAccess: true,
        pagination: false,
        req,
        where: { and: [{ dimension: { equals: "purpose" } }, { slug: { in: purposes.map((purpose) => purpose.slug) } }] },
      });
      if (readback.totalDocs !== purposes.length) {
        throw new Error(`Purpose taxonomy readback found ${readback.totalDocs}/${purposes.length}.`);
      }
      await commitTransaction(req);
      console.log(JSON.stringify({
        action: "provision_core_taxonomies",
        apply: true,
        created,
        environment,
        readback: "PASS",
        runID,
      }, null, 2));
    } catch (error) {
      await killTransaction(req);
      throw error;
    }
  }
} finally {
  await payload.destroy();
}

process.exit(0);
