import "dotenv/config";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getPayload } from "payload";

import config from "@payload-config";
import { lexicalToAgentBody } from "@/agent/content";
import type { EditorialMaster } from "@/payload-types";
import {
  parseTranslationJSONL,
  type ColdStartTranslationBundle,
} from "./cold-start-translation-contract";

const REVIEW_DECISION_VERSION = "ColdStartReviewDecisionV1" as const;

type ReviewDecision = {
  contentHash: string;
  contentKey: string;
  decision: "approved";
  note?: string;
  version: typeof REVIEW_DECISION_VERSION;
};

const decisionsPath = requiredPath("--decisions=");
const translationsPath = requiredPath("--translations=");
const reviewOutputPath = requiredPath("--review-output=");
const translationOutputPath = requiredPath("--translation-output=");
const requestedBatches = new Set((process.argv.find((argument) => argument.startsWith("--batches="))?.slice("--batches=".length) ?? "")
  .split(",").map((value) => value.trim()).filter(Boolean));
const allDecisions = parseDecisions(await readFile(decisionsPath, "utf8"));
const allTranslations = parseTranslationJSONL(await readFile(translationsPath, "utf8"));
const translations = requestedBatches.size
  ? allTranslations.filter((bundle) => requestedBatches.has(bundle.batchId))
  : allTranslations;
const allDecisionByKey = new Map(allDecisions.map((decision) => [decision.contentKey, decision]));
const decisions = translations.map((bundle) => allDecisionByKey.get(bundle.contentKey)).filter((decision): decision is ReviewDecision => Boolean(decision));
const decisionByKey = new Map(decisions.map((decision) => [decision.contentKey, decision]));
const translationByKey = new Map(translations.map((bundle) => [bundle.contentKey, bundle]));

if (!translations.length || decisions.length !== translations.length || decisions.some((decision) => !translationByKey.has(decision.contentKey))) {
  throw new Error("Approved decisions and translation bundles must contain the same content keys.");
}

const payload = await getPayload({ config });
try {
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
  const reboundDecisions: ReviewDecision[] = [];
  const reboundTranslations: ColdStartTranslationBundle[] = [];

  for (const contentKey of decisions.map((decision) => decision.contentKey)) {
    const decision = decisionByKey.get(contentKey)!;
    const bundle = translationByKey.get(contentKey)!;
    const master = masterByKey.get(contentKey)!;
    if (decision.contentHash !== bundle.sourceContentHash) {
      throw new Error(`${contentKey} approved hash does not match the translated Chinese source.`);
    }
    if (!master.contentHash || !/^[a-f0-9]{64}$/.test(master.contentHash)) {
      throw new Error(`${contentKey} has no target-environment content hash.`);
    }
    if (master.rightsStatus !== "cleared") {
      throw new Error(`${contentKey} does not have cleared source rights.`);
    }
    const source = sourceSnapshot(master);
    if (JSON.stringify(source) !== JSON.stringify(bundle.source)) {
      throw new Error(`${contentKey} target Chinese source differs from the approved translated source.`);
    }
    reboundDecisions.push({
      ...decision,
      contentHash: master.contentHash,
      note: decision.note
        ? `${decision.note} Target-environment IDs rebound after exact Chinese source readback.`
        : "Target-environment IDs rebound after exact Chinese source readback.",
    });
    reboundTranslations.push({
      ...bundle,
      sourceContentHash: master.contentHash,
      sourceMasterId: master.id,
    });
  }

  await writeFile(reviewOutputPath, `${reboundDecisions.map((decision) => JSON.stringify(decision)).join("\n")}\n`, "utf8");
  await writeFile(translationOutputPath, `${reboundTranslations.map((bundle) => JSON.stringify(bundle)).join("\n")}\n`, "utf8");
  console.log(JSON.stringify({
    action: "rebind_cold_start_release_manifests",
    batches: [...new Set(reboundTranslations.map((bundle) => bundle.batchId))],
    entries: reboundDecisions.length,
    reviewOutputPath,
    translationOutputPath,
    verification: "EXACT_CHINESE_SOURCE_MATCH",
  }, null, 2));
} finally {
  await payload.destroy();
}

function requiredPath(prefix: string) {
  const value = process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
  if (!value) throw new Error(`Missing ${prefix}<absolute-path>.`);
  return path.resolve(value);
}

function parseDecisions(raw: string): ReviewDecision[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length || lines.length > 500) throw new Error("Review decisions must contain 1 to 500 entries.");
  const seen = new Set<string>();
  return lines.map((line, index) => {
    const value = JSON.parse(line) as Partial<ReviewDecision>;
    if (value.version !== REVIEW_DECISION_VERSION || value.decision !== "approved"
      || !value.contentKey?.trim() || !/^[a-f0-9]{64}$/.test(value.contentHash ?? "")) {
      throw new Error(`Review decision line ${index + 1} is invalid.`);
    }
    if (seen.has(value.contentKey)) throw new Error(`Duplicate review decision: ${value.contentKey}.`);
    seen.add(value.contentKey);
    return value as ReviewDecision;
  });
}

function sourceSnapshot(master: EditorialMaster) {
  const root = (master.bodyZh as { root?: unknown } | null)?.root;
  if (!root) throw new Error(`${master.contentKey} has no readable Chinese body.`);
  return {
    titleZh: master.titleZh,
    summaryZh: master.summaryZh,
    bodyZh: lexicalToAgentBody(root),
  };
}

process.exit(0);
