import "dotenv/config";

import { writeFile } from "node:fs/promises";
import path from "node:path";

import { getPayload } from "payload";

import config from "@payload-config";
import { lexicalToAgentBody } from "@/agent/content";
import type { EditorialMaster } from "@/payload-types";
import {
  COLD_START_TRANSLATION_VERSION,
  type ColdStartTranslationBundle,
  validateTranslationBundle,
} from "./cold-start-translation-contract";

const batchArgument = process.argv.find((value) => value.startsWith("--batches="));
const outputArgument = process.argv.find((value) => value.startsWith("--output="));
const batches = (batchArgument?.slice("--batches=".length) || process.env.COLD_START_BATCHES || "")
  .split(",").map((value) => value.trim()).filter(Boolean);
const outputPath = path.resolve(outputArgument?.slice("--output=".length)
  || process.env.COLD_START_TRANSLATION_OUTPUT
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-translation-template.jsonl");

if (!batches.length) throw new Error("Use --batches=batch-a,batch-b or set COLD_START_BATCHES.");

const payload = await getPayload({ config });
try {
  const masters = await payload.find({
    collection: "editorial-masters",
    depth: 0,
    draft: true,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    sort: "contentKey",
    where: { batchId: { in: batches } },
  });
  if (!masters.docs.length) throw new Error("No editorial masters found for the requested batches.");
  const invalid = masters.docs.filter((master) =>
    !["approved", "translated"].includes(master.editorialStatus) || master.rightsStatus !== "cleared");
  if (invalid.length) {
    const summary = invalid.slice(0, 8).map((master) =>
      `${master.contentKey}:${master.editorialStatus}/${master.rightsStatus}`).join(", ");
    throw new Error(`${invalid.length} master(s) have not passed the Chinese approval and rights gate: ${summary}`);
  }

  const bundles = masters.docs.map(templateForMaster);
  for (const [index, bundle] of bundles.entries()) validateTranslationBundle(bundle, index + 1, { allowIncomplete: true });
  await writeFile(outputPath, `${bundles.map((bundle) => JSON.stringify(bundle)).join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ batches, entries: bundles.length, outputPath }, null, 2));
} finally {
  await payload.destroy();
}

function templateForMaster(master: EditorialMaster): ColdStartTranslationBundle {
  const bodyRoot = (master.bodyZh as { root?: unknown } | null)?.root;
  if (!bodyRoot) throw new Error(`Editorial master ${master.contentKey} has no readable Chinese body.`);
  return {
    version: COLD_START_TRANSLATION_VERSION,
    batchId: master.batchId,
    contentKey: master.contentKey,
    sourceContentHash: master.contentHash,
    sourceMasterId: master.id,
    translationGroup: `site:${master.contentKey}`,
    source: {
      titleZh: master.titleZh,
      summaryZh: master.summaryZh,
      bodyZh: lexicalToAgentBody(bodyRoot),
    },
    translations: { en: null, es: null },
  };
}
