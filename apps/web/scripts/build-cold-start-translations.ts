import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AgentArticleBodyV1, AgentBlock, AgentInline } from "@/agent/contracts";
import {
  coldStartLocales,
  parseTranslationJSONL,
  validateTranslationBundle,
  type ColdStartLocale,
  type ColdStartTranslationBundle,
  type TranslationCopy,
} from "./cold-start-translation-contract";

const COPY_VERSION = "ColdStartTranslationCopyV1" as const;

type CopyBody = {
  blocks: Array<string | string[]>;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  summary: string;
  title: string;
};

type CopyEntry = {
  contentKey: string;
  translations: Record<ColdStartLocale, CopyBody>;
  version: typeof COPY_VERSION;
};

const templateArgument = process.argv.find((value) => value.startsWith("--template="));
const copyArgument = process.argv.find((value) => value.startsWith("--copy="));
const outputArgument = process.argv.find((value) => value.startsWith("--output="));
const allowIncomplete = process.argv.includes("--allow-incomplete");
const templatePath = path.resolve(templateArgument?.slice("--template=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-60-translation-template.jsonl");
const copyPath = path.resolve(copyArgument?.slice("--copy=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-60-translation-copy.json");
const outputPath = path.resolve(outputArgument?.slice("--output=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-60-translations.jsonl");

const templates = parseTemplates(await readFile(templatePath, "utf8"));
const copies = parseCopies(await readFile(copyPath, "utf8"));
const copiesByKey = new Map(copies.map((entry) => [entry.contentKey, entry]));
const unknown = copies.filter((entry) => !templates.some((template) => template.contentKey === entry.contentKey));
if (unknown.length) throw new Error(`Translation copy has unknown content keys: ${unknown.map((entry) => entry.contentKey).join(", ")}`);

const selectedTemplates = allowIncomplete
  ? templates.filter((template) => copiesByKey.has(template.contentKey))
  : templates;
const bundles = selectedTemplates.map((template, index) => {
  const copy = copiesByKey.get(template.contentKey);
  if (!copy) throw new Error(`Translation copy is missing ${template.contentKey}.`);
  const bundle: ColdStartTranslationBundle = {
    ...template,
    translations: Object.fromEntries(coldStartLocales.map((locale) => [
      locale,
      buildTranslation(template.source.bodyZh, copy.translations[locale], template.contentKey, locale),
    ])) as Record<ColdStartLocale, TranslationCopy>,
  };
  return validateTranslationBundle(bundle, index + 1);
});

await writeFile(outputPath, `${bundles.map((bundle) => JSON.stringify(bundle)).join("\n")}\n`, "utf8");
parseTranslationJSONL(await readFile(outputPath, "utf8"));
console.log(JSON.stringify({ allowIncomplete, copies: copies.length, entries: bundles.length, expected: templates.length, outputPath }, null, 2));

function parseTemplates(raw: string) {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line, index) => validateTranslationBundle(JSON.parse(line), index + 1, { allowIncomplete: true }));
}

function parseCopies(raw: string) {
  const values: unknown[] = raw.trim().startsWith("[")
    ? JSON.parse(raw)
    : raw.split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
  if (!Array.isArray(values) || !values.length || values.length > 500) {
    throw new Error("Translation copy must contain 1 to 500 entries.");
  }
  const seen = new Set<string>();
  return values.map((rawValue, index) => {
    const value = rawValue as Partial<CopyEntry>;
    if (value.version !== COPY_VERSION || !value.contentKey?.trim()) {
      throw new Error(`Translation copy line ${index + 1} must be a keyed ${COPY_VERSION}.`);
    }
    if (seen.has(value.contentKey)) throw new Error(`Duplicate translation copy: ${value.contentKey}.`);
    seen.add(value.contentKey);
    const locales = Object.keys(value.translations ?? {}).sort().join(",");
    if (locales !== "en,es") throw new Error(`Translation copy line ${index + 1} must contain exactly en and es.`);
    return value as CopyEntry;
  });
}

function buildTranslation(
  source: AgentArticleBodyV1,
  copy: CopyBody,
  contentKey: string,
  locale: ColdStartLocale,
): TranslationCopy {
  for (const field of ["title", "summary", "slug", "seoTitle", "seoDescription"] as const) {
    if (typeof copy?.[field] !== "string" || !copy[field].trim()) {
      throw new Error(`${contentKey}:${locale} has no ${field}.`);
    }
  }
  if (!Array.isArray(copy.blocks) || copy.blocks.length !== source.blocks.length) {
    throw new Error(`${contentKey}:${locale} has ${copy.blocks?.length ?? 0} translated blocks; expected ${source.blocks.length}.`);
  }
  const blocks = source.blocks.map((block, index) => translateBlock(block, copy.blocks[index], contentKey, locale, index));
  return { body: { version: source.version, blocks }, ...copy };
}

function translateBlock(
  source: AgentBlock,
  translated: string | string[] | undefined,
  contentKey: string,
  locale: ColdStartLocale,
  index: number,
): AgentBlock {
  const label = `${contentKey}:${locale}:block-${index + 1}`;
  if (source.type === "list") {
    if (!Array.isArray(translated) || translated.length !== source.items.length) {
      throw new Error(`${label} must contain ${source.items.length} list items.`);
    }
    return {
      ...source,
      items: source.items.map((item, itemIndex) => ({
        ...item,
        children: replaceOnlyText(item.children, translated[itemIndex], `${label}:item-${itemIndex + 1}`),
      })),
    };
  }
  if (typeof translated !== "string") throw new Error(`${label} must be a string.`);
  return { ...source, children: replaceOnlyText(source.children, translated, label) };
}

function replaceOnlyText(children: AgentInline[], text: string | undefined, label: string): AgentInline[] {
  if (typeof text !== "string" || !text.trim()) throw new Error(`${label} is empty.`);
  if (children.length !== 1 || children[0]?.type !== "text") {
    throw new Error(`${label} source must contain exactly one plain-text inline.`);
  }
  return [{ ...children[0], text }];
}
