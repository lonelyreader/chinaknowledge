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
import { agentBodyToLexical, lexicalToAgentBody } from "@/agent/content";
import type { Article, EditorialMaster } from "@/payload-types";
import { requireCMSOperationTarget } from "./cms-operation-target";
import {
  coldStartLocales,
  parseTranslationJSONL,
  type ColdStartLocale,
  type ColdStartTranslationBundle,
} from "./cold-start-translation-contract";

const apply = process.argv.includes("--apply");
const allowUpdates = process.argv.includes("--update-existing");
const inputArgument = process.argv.find((value) => value.startsWith("--input="));
const auditArgument = process.argv.find((value) => value.startsWith("--audit="));
const inputPath = inputArgument?.slice("--input=".length) || process.env.COLD_START_TRANSLATION_INPUT;
const auditPath = auditArgument?.slice("--audit=".length) || process.env.COLD_START_TRANSLATION_AUDIT;
const actorEmail = process.env.COLD_START_ACTOR_EMAIL?.trim().toLowerCase();
const environment = requireCMSOperationTarget({
  apply,
  productionConfirmation: "IMPORT_COLD_START_TRANSLATIONS_IN_PRODUCTION",
  productionConfirmationVariable: "COLD_START_TRANSLATION_PRODUCTION_CONFIRM",
});

if (!inputPath) throw new Error("Use --input=/absolute/path/translations.jsonl or set COLD_START_TRANSLATION_INPUT.");
if (apply && environment !== "local" && !actorEmail) {
  throw new Error("COLD_START_ACTOR_EMAIL is required for non-local --apply.");
}
if (apply && process.env.COLD_START_TRANSLATION_APPLY_CONFIRM !== "IMPORT_COLD_START_TRANSLATIONS") {
  throw new Error("Set COLD_START_TRANSLATION_APPLY_CONFIRM=IMPORT_COLD_START_TRANSLATIONS before --apply.");
}

const absoluteInputPath = path.resolve(inputPath);
const bundles = parseTranslationJSONL(await readFile(absoluteInputPath, "utf8"));
const manifestHash = createHash("sha256").update(JSON.stringify(bundles)).digest("hex");
const payload = await getPayload({ config });
const runID = randomUUID();
const result = {
  apply,
  articleCount: bundles.length * coldStartLocales.length,
  conflicts: [] as string[],
  created: [] as number[],
  environment,
  input: bundles.length,
  manifestHash,
  mastersMarkedTranslated: [] as number[],
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
    limit: bundles.length,
    overrideAccess: true,
    pagination: false,
    where: { contentKey: { in: bundles.map((bundle) => bundle.contentKey) } },
  });
  if (masters.totalDocs !== bundles.length) {
    throw new Error(`Found ${masters.totalDocs}/${bundles.length} requested Chinese masters.`);
  }
  const masterByKey = new Map(masters.docs.map((master) => [master.contentKey, master]));
  const desired = bundles.flatMap((bundle) => {
    const master = masterByKey.get(bundle.contentKey)!;
    assertSourceGate(bundle, master);
    return coldStartLocales.map((locale) => desiredArticle(bundle, locale, master));
  });

  const existing = await payload.find({
    collection: "articles",
    depth: 0,
    draft: true,
    limit: desired.length,
    overrideAccess: true,
    pagination: false,
    where: { translationGroup: { in: bundles.map((bundle) => bundle.translationGroup) } },
  });
  const existingByIdentity = new Map(existing.docs.map((article) => [articleIdentity(article), article]));

  for (const item of desired) {
    const current = existingByIdentity.get(`${item.translationGroup}:${item.locale}`);
    if (!current) continue;
    if (relationID(current.editorialMaster) !== item.editorialMaster) {
      result.conflicts.push(`${item.translationGroup}:${item.locale}:foreign-master`);
      continue;
    }
    if (current.publicationStatus !== "draft" || current.workflowStatus === "public") {
      result.conflicts.push(`${item.translationGroup}:${item.locale}:already-public`);
      continue;
    }
    if (articleSemanticHash(current) === item.semanticHash) result.skipped.push(Number(current.id));
    else result.conflicts.push(`${item.translationGroup}:${item.locale}:content-differs`);
  }
  if (result.conflicts.length && !allowUpdates) {
    throw new Error(`${result.conflicts.length} existing translation(s) conflict. Review before using --update-existing.`);
  }
  if (result.conflicts.some((conflict) => conflict.endsWith(":foreign-master") || conflict.endsWith(":already-public"))) {
    throw new Error("Foreign-master and already-public translations cannot be updated by this importer.");
  }

  if (apply) {
    const req = await createLocalReq({ user: actor! }, payload);
    if (!(await initTransaction(req))) throw new Error("Translation import could not start a database transaction.");
    try {
      for (const item of desired) {
        const current = existingByIdentity.get(`${item.translationGroup}:${item.locale}`);
        if (current && articleSemanticHash(current) === item.semanticHash) continue;
        if (current) {
          const updated = await payload.update({
            collection: "articles",
            id: current.id,
            data: item.data,
            draft: true,
            overrideAccess: false,
            req,
          });
          result.updated.push(Number(updated.id));
        } else {
          const created = await payload.create({
            collection: "articles",
            data: item.data,
            draft: true,
            overrideAccess: false,
            req,
          });
          result.created.push(Number(created.id));
        }
      }

      const readback = await payload.find({
        collection: "articles",
        depth: 0,
        draft: true,
        limit: desired.length,
        overrideAccess: true,
        pagination: false,
        req,
        where: { translationGroup: { in: bundles.map((bundle) => bundle.translationGroup) } },
      });
      if (readback.totalDocs !== desired.length) {
        throw new Error(`Translation readback found ${readback.totalDocs}/${desired.length} Articles.`);
      }
      const readbackByIdentity = new Map(readback.docs.map((article) => [articleIdentity(article), article]));
      for (const item of desired) {
        const article = readbackByIdentity.get(`${item.translationGroup}:${item.locale}`);
        if (!article || articleSemanticHash(article) !== item.semanticHash) {
          throw new Error(`Translation readback mismatch: ${item.translationGroup}:${item.locale}.`);
        }
      }

      for (const master of masters.docs) {
        if (master.editorialStatus === "translated") continue;
        const updated = await payload.update({
          collection: "editorial-masters",
          id: master.id,
          data: {
            editorialStatus: "translated",
            translationNotes: `English and Spanish imported from manifest ${manifestHash}; run ${runID}.`,
          },
          draft: true,
          overrideAccess: false,
          req,
        });
        result.mastersMarkedTranslated.push(Number(updated.id));
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
    inputPath: absoluteInputPath,
    readback: apply ? "PASS" : "NOT_RUN",
  };
  if (auditPath) await appendFile(path.resolve(auditPath), `${JSON.stringify(auditRecord)}\n`, "utf8");
  console.log(JSON.stringify(auditRecord, null, 2));
} finally {
  await payload.destroy();
}

function assertSourceGate(bundle: ColdStartTranslationBundle, master: EditorialMaster) {
  if (String(bundle.sourceMasterId) !== String(master.id)) {
    throw new Error(`${bundle.contentKey} source master ID changed.`);
  }
  if (bundle.sourceContentHash !== master.contentHash) {
    throw new Error(`${bundle.contentKey} Chinese master changed after translation started.`);
  }
  if (!["approved", "translated"].includes(master.editorialStatus) || master.rightsStatus !== "cleared") {
    throw new Error(`${bundle.contentKey} has not passed the Chinese approval and rights gate.`);
  }
  const bodyRoot = (master.bodyZh as { root?: unknown } | null)?.root;
  if (!bodyRoot) throw new Error(`${bundle.contentKey} has no readable Chinese body.`);
  const currentSource = {
    titleZh: master.titleZh,
    summaryZh: master.summaryZh,
    bodyZh: lexicalToAgentBody(bodyRoot),
  };
  if (JSON.stringify(currentSource) !== JSON.stringify(bundle.source)) {
    throw new Error(`${bundle.contentKey} Chinese source snapshot does not match the approved master.`);
  }
}

function desiredArticle(
  bundle: ColdStartTranslationBundle,
  locale: ColdStartLocale,
  master: EditorialMaster,
) {
  const copy = bundle.translations[locale];
  if (!copy) throw new Error(`${bundle.contentKey} is missing ${locale}.`);
  const purposes = [relationNumber(master.purpose)];
  const topics = (master.topics ?? []).map(relationNumber);
  const sourceNotes = (master.sourceNotes ?? []).map((source) => ({
    label: source.label,
    url: source.url,
    checkedAt: source.checkedAt,
    check: source.check,
  }));
  const checkedTimes = sourceNotes.map((source) => Date.parse(source.checkedAt ?? "")).filter(Number.isFinite);
  if (!checkedTimes.length) throw new Error(`${bundle.contentKey} has no valid source verification date.`);
  const freshnessDate = new Date(Math.max(...checkedTimes)).toISOString();
  const semanticValue = {
    body: copy.body,
    editorialMaster: master.id,
    freshnessDate,
    locale,
    purposes,
    seoDescription: copy.seoDescription,
    seoTitle: copy.seoTitle,
    slug: copy.slug,
    sourceNotes,
    summary: copy.summary,
    title: copy.title,
    topics,
    translationGroup: bundle.translationGroup,
  };
  const data = {
    authorshipType: "site" as const,
    body: agentBodyToLexical(copy.body) as Article["body"],
    editorialMaster: master.id,
    format: "guide" as const,
    freshnessDate,
    homepagePlacement: "none" as const,
    locale,
    purposes,
    seo: { title: copy.seoTitle, description: copy.seoDescription },
    slug: copy.slug,
    sourceNotes,
    summary: copy.summary,
    title: copy.title,
    topics,
    translationGroup: bundle.translationGroup,
  };
  return { data, editorialMaster: master.id, locale, semanticHash: hash(semanticValue), translationGroup: bundle.translationGroup };
}

function articleSemanticHash(article: Article) {
  const bodyRoot = (article.body as { root?: unknown } | null)?.root;
  if (!bodyRoot) return "unreadable";
  return hash({
    body: lexicalToAgentBody(bodyRoot),
    editorialMaster: relationID(article.editorialMaster),
    freshnessDate: canonicalDate(article.freshnessDate),
    locale: article.locale,
    purposes: (article.purposes ?? []).map(relationID),
    seoDescription: article.seo?.description ?? "",
    seoTitle: article.seo?.title ?? "",
    slug: article.slug,
    sourceNotes: (article.sourceNotes ?? []).map((source) => ({
      label: source.label,
      url: source.url,
      checkedAt: canonicalDate(source.checkedAt),
      check: source.check,
    })),
    summary: article.summary ?? "",
    title: article.title,
    topics: (article.topics ?? []).map(relationID),
    translationGroup: article.translationGroup,
  });
}

function articleIdentity(article: Pick<Article, "locale" | "translationGroup">) {
  return `${article.translationGroup}:${article.locale}`;
}

function relationID(value: unknown): number | string {
  if (value && typeof value === "object") {
    if ("id" in value) return (value as { id: number | string }).id;
    if ("value" in value) return relationID((value as { value: unknown }).value);
  }
  if (typeof value === "number" || typeof value === "string") return value;
  throw new Error("Missing relationship ID.");
}

function relationNumber(value: unknown): number {
  const id = relationID(value);
  if (typeof id !== "number") throw new Error("Expected a numeric Payload relationship ID.");
  return id;
}

function canonicalDate(value: string | null | undefined) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? value : new Date(time).toISOString();
}

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
