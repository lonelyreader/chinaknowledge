import "dotenv/config";

import { createHash, randomUUID } from "node:crypto";
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
import { agentBodyToLexical } from "@/agent/content";
import { AGENT_BODY_VERSION, type AgentArticleBodyV1 } from "@/agent/contracts";
import { editorialMasterContentHash } from "@/cms/editorial-master-hooks";
import type { EditorialMaster, Taxonomy } from "@/payload-types";
import { requireCMSOperationTarget } from "./cms-operation-target";

type Risk = EditorialMaster["risk"];
type SourceRights = NonNullable<EditorialMaster["sourceNotes"]>[number]["rights"];

type ManifestEntry = {
  batchId: string;
  bodyZh: AgentArticleBodyV1;
  contentFormat: "detailed-guide-v1";
  contentKey: string;
  purpose: string;
  risk: Risk;
  rightsStatus: EditorialMaster["rightsStatus"];
  sourceNotes: Array<{
    capturedAt?: string;
    checkedAt: string;
    check?: string;
    label: string;
    rights: SourceRights;
    url: string;
  }>;
  summaryZh: string;
  titleZh: string;
  topics?: string[];
  sectionRoles: Array<"decision" | "scope" | "preparation" | "procedure" | "exceptions" | "differences" | "verification">;
};

const requiredGuideRoles = ["decision", "scope", "preparation", "procedure", "exceptions", "verification"] as const;

const apply = process.argv.includes("--apply");
const allowUpdates = process.argv.includes("--update-existing");
const inputArgument = process.argv.find((value) => value.startsWith("--input="));
const auditArgument = process.argv.find((value) => value.startsWith("--audit="));
const inputPath = inputArgument?.slice("--input=".length) || process.env.COLD_START_INPUT;
const auditPath = auditArgument?.slice("--audit=".length) || process.env.COLD_START_AUDIT;
const actorEmail = process.env.COLD_START_ACTOR_EMAIL?.trim().toLowerCase();
const environment = requireCMSOperationTarget({
  apply,
  productionConfirmation: "IMPORT_COLD_START_CONTENT_IN_PRODUCTION",
  productionConfirmationVariable: "COLD_START_PRODUCTION_CONFIRM",
});

if (!inputPath) throw new Error("Use --input=/absolute/path/manifest.jsonl or set COLD_START_INPUT.");
if (apply && environment !== "local" && !actorEmail) throw new Error("COLD_START_ACTOR_EMAIL is required for non-local --apply.");
if (apply && process.env.COLD_START_APPLY_CONFIRM !== "IMPORT_COLD_START_CONTENT") {
  throw new Error("Set COLD_START_APPLY_CONFIRM=IMPORT_COLD_START_CONTENT before --apply.");
}

const manifestAbsolutePath = path.resolve(inputPath);
const entries = parseManifest(await readFile(manifestAbsolutePath, "utf8"));
const manifestHash = createHash("sha256").update(JSON.stringify(entries)).digest("hex");
const runID = randomUUID();
const payload = await getPayload({ config });

const result = {
  apply,
  batchIds: [...new Set(entries.map((entry) => entry.batchId))],
  conflicts: [] as string[],
  created: [] as number[],
  environment,
  input: entries.length,
  manifestHash,
  runID,
  skipped: [] as number[],
  updated: [] as number[],
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
          ? { and: [{ email: { equals: actorEmail } }, { role: { equals: "super_admin" } }, { accountStatus: { equals: "active" } }] }
          : { and: [{ role: { equals: "super_admin" } }, { accountStatus: { equals: "active" } }] },
      })
    : null;
  const actor = actorCandidates
    ? [...actorCandidates.docs].sort((left, right) => Number(left.id) - Number(right.id))[0]
    : null;
  if (apply && (!actor || actor.role !== "super_admin")) {
    throw new Error("COLD_START_ACTOR_EMAIL must identify an active Super Admin.");
  }

  const taxonomies = await payload.find({
    collection: "taxonomies",
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
  });
  const taxonomyByKey = new Map(taxonomies.docs.map((taxonomy) => [taxonomyKey(taxonomy), taxonomy]));
  const desired = entries.map((entry) => desiredMaster(entry, taxonomyByKey, actor?.id));
  const existing = await payload.find({
    collection: "editorial-masters",
    depth: 0,
    draft: true,
    limit: entries.length,
    overrideAccess: true,
    pagination: false,
    where: { contentKey: { in: entries.map((entry) => entry.contentKey) } },
  });
  const existingByKey = new Map(existing.docs.map((master) => [master.contentKey, master]));
  const existingSemanticHash = new Map(existing.docs.map((master) => [master.id, editorialMasterContentHash(master)]));

  for (const item of desired) {
    const current = existingByKey.get(item.contentKey);
    if (!current) continue;
    if (existingSemanticHash.get(current.id) === item.contentHash) result.skipped.push(current.id);
    else result.conflicts.push(item.contentKey);
  }
  if (result.conflicts.length && !allowUpdates) {
    throw new Error(`${result.conflicts.length} existing master(s) differ. Re-run with --update-existing after review.`);
  }

  if (apply) {
    const req = await createLocalReq({ user: actor! }, payload);
    if (!(await initTransaction(req))) throw new Error("Cold-start import could not start a database transaction.");
    try {
      for (const item of desired) {
        const current = existingByKey.get(item.contentKey);
        if (current && existingSemanticHash.get(current.id) === item.contentHash) continue;
        if (current) {
          const updated = await payload.update({
            collection: "editorial-masters",
            id: current.id,
            data: item,
            draft: true,
            overrideAccess: false,
            req,
          });
          result.updated.push(updated.id);
        } else {
          const created = await payload.create({
            collection: "editorial-masters",
            data: item,
            draft: true,
            overrideAccess: false,
            req,
          });
          result.created.push(created.id);
        }
      }
      const readback = await payload.find({
        collection: "editorial-masters",
        depth: 0,
        draft: true,
        limit: entries.length,
        overrideAccess: true,
        pagination: false,
        req,
        where: { contentKey: { in: entries.map((entry) => entry.contentKey) } },
      });
      if (readback.totalDocs !== entries.length) {
        throw new Error(`Readback found ${readback.totalDocs}/${entries.length} requested masters.`);
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
    inputPath: manifestAbsolutePath,
    readback: apply ? "PASS" : "NOT_RUN",
  };
  if (auditPath) await appendFile(path.resolve(auditPath), `${JSON.stringify(auditRecord)}\n`, "utf8");
  console.log(JSON.stringify(auditRecord, null, 2));
} finally {
  await payload.destroy();
}

function parseManifest(raw: string): ManifestEntry[] {
  const values = raw.split(/\r?\n/).filter((line) => line.trim()).map((line, index) => {
    try { return JSON.parse(line) as unknown; }
    catch { throw new Error(`Manifest line ${index + 1} is not valid JSON.`); }
  });
  if (!values.length || values.length > 500) throw new Error("Manifest must contain 1 to 500 entries.");
  const seen = new Set<string>();
  return values.map((value, index) => validateEntry(value, index + 1, seen));
}

function validateEntry(value: unknown, line: number, seen: Set<string>): ManifestEntry {
  if (!value || typeof value !== "object") throw new Error(`Manifest line ${line} must be an object.`);
  const entry = value as Partial<ManifestEntry>;
  for (const field of ["batchId", "contentKey", "purpose", "summaryZh", "titleZh"] as const) {
    if (typeof entry[field] !== "string" || !entry[field].trim()) throw new Error(`Manifest line ${line} has no ${field}.`);
  }
  if (seen.has(entry.contentKey!)) throw new Error(`Duplicate contentKey: ${entry.contentKey}`);
  seen.add(entry.contentKey!);
  if (entry.contentFormat !== "detailed-guide-v1") throw new Error(`Manifest line ${line} must use detailed-guide-v1.`);
  validateDetailedGuideBody(entry.bodyZh, entry.sectionRoles, line);
  if (!(["evergreen", "annual", "volatile", "high"] as const).includes(entry.risk as Risk)) {
    throw new Error(`Manifest line ${line} has an invalid risk.`);
  }
  if (!(["pending", "cleared", "restricted"] as const).includes(entry.rightsStatus as EditorialMaster["rightsStatus"])) {
    throw new Error(`Manifest line ${line} has an invalid rightsStatus.`);
  }
  if (!Array.isArray(entry.sourceNotes) || !entry.sourceNotes.length) throw new Error(`Manifest line ${line} requires sources.`);
  for (const source of entry.sourceNotes) {
    if (!source.label?.trim() || !source.checkedAt || !source.rights) throw new Error(`Manifest line ${line} has an incomplete source.`);
    const url = new URL(source.url);
    if (!(["http:", "https:"] as const).includes(url.protocol as "http:" | "https:")) throw new Error(`Manifest line ${line} has an unsafe source URL.`);
  }
  return entry as ManifestEntry;
}

function taxonomyKey(taxonomy: Taxonomy) {
  return `${taxonomy.dimension}:${taxonomy.slug}`;
}

function desiredMaster(entry: ManifestEntry, taxonomies: Map<string, Taxonomy>, actorID?: number) {
  const purpose = taxonomies.get(`purpose:${entry.purpose}`);
  if (!purpose) throw new Error(`Missing purpose taxonomy: ${entry.purpose}`);
  const topics = (entry.topics ?? []).map((slug) => {
    const topic = taxonomies.get(`topic:${slug}`);
    if (!topic) throw new Error(`Missing topic taxonomy: ${slug}`);
    return topic.id;
  });
  const bodyZh = agentBodyToLexical(entry.bodyZh) as EditorialMaster["bodyZh"];
  const sourceNotes = entry.sourceNotes.map((source) => ({ ...source }));
  const base = {
    batchId: entry.batchId,
    bodyZh,
    contentKey: entry.contentKey,
    createdBy: actorID ?? 0,
    editorialStatus: "candidate" as const,
    purpose: purpose.id,
    risk: entry.risk,
    rightsStatus: entry.rightsStatus,
    sourceNotes,
    summaryZh: entry.summaryZh,
    titleZh: entry.titleZh,
    topics,
  };
  return { ...base, contentHash: editorialMasterContentHash(base) };
}

function validateDetailedGuideBody(
  body: AgentArticleBodyV1 | undefined,
  roles: ManifestEntry["sectionRoles"] | undefined,
  line: number,
) {
  if (!body || body.version !== AGENT_BODY_VERSION || !Array.isArray(body.blocks)) {
    throw new Error(`Manifest line ${line} bodyZh must be AgentArticleBodyV1.`);
  }
  agentBodyToLexical(body);
  const headings = body.blocks.filter((block) => block.type === "heading");
  const paragraphs = body.blocks.filter((block) => block.type === "paragraph");
  const lists = body.blocks.filter((block) => block.type === "list");
  const listItems = lists.reduce((total, block) => total + block.items.length, 0);
  const text = body.blocks.flatMap((block) => {
    if (block.type === "list") return block.items.flatMap((item) => item.children);
    return block.children;
  }).map((inline) => inline.type === "text" ? inline.text : inline.type === "link" ? inline.children.map((child) => child.text).join("") : "").join("");
  const bodyChars = text.replace(/\s/g, "").length;
  if (bodyChars < 1500 || bodyChars > 5000) {
    throw new Error(`Manifest line ${line} detailed guide has ${bodyChars} characters; expected 1500-5000.`);
  }
  if (headings.length < 6 || paragraphs.length < 6 || lists.length < 2 || listItems < 8) {
    throw new Error(`Manifest line ${line} is still an outline; require 6 headings, 6 paragraphs, 2 lists and 8 list items.`);
  }
  if (!Array.isArray(roles)) throw new Error(`Manifest line ${line} requires sectionRoles.`);
  const missing = requiredGuideRoles.filter((role) => !roles.includes(role));
  if (missing.length) throw new Error(`Manifest line ${line} is missing section roles: ${missing.join(", ")}.`);
}
