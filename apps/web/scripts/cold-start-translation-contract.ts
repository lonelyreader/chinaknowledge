import { createHash } from "node:crypto";

import { AGENT_BODY_VERSION, type AgentArticleBodyV1, type AgentBlock, type AgentInline } from "@/agent/contracts";
import { agentBodyToLexical } from "@/agent/content";

export const COLD_START_TRANSLATION_VERSION = "ColdStartTranslationV1" as const;
export const coldStartLocales = ["en", "es"] as const;

export type ColdStartLocale = (typeof coldStartLocales)[number];

export type TranslationCopy = {
  body: AgentArticleBodyV1;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  summary: string;
  title: string;
};

export type ColdStartTranslationBundle = {
  batchId: string;
  contentKey: string;
  source: {
    bodyZh: AgentArticleBodyV1;
    summaryZh: string;
    titleZh: string;
  };
  sourceContentHash: string;
  sourceMasterId: number | string;
  translationGroup: string;
  translations: Record<ColdStartLocale, TranslationCopy | null>;
  version: typeof COLD_START_TRANSLATION_VERSION;
};

type StructureBlock = {
  links: string[];
  numberTokens: string[];
  style?: "bullet" | "number";
  textLength: number;
  type: AgentBlock["type"];
  itemCount?: number;
  level?: 2 | 3 | 4;
};

const fillerPatterns: Record<ColdStartLocale, RegExp[]> = {
  en: [
    /\bin conclusion\b/i,
    /\bit is important to note\b/i,
    /\bit is worth noting\b/i,
    /\bthis comprehensive guide\b/i,
    /\bnavigating the complexities\b/i,
  ],
  es: [
    /\ben conclusi[oó]n\b/i,
    /\bes importante destacar\b/i,
    /\bcabe destacar\b/i,
    /\besta completa gu[ií]a\b/i,
    /\bnavegar por las complejidades\b/i,
  ],
};

export function parseTranslationJSONL(raw: string): ColdStartTranslationBundle[] {
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length || lines.length > 500) throw new Error("Translation manifest must contain 1 to 500 entries.");
  const seen = new Set<string>();
  return lines.map((line, index) => {
    let value: unknown;
    try { value = JSON.parse(line); }
    catch { throw new Error(`Translation manifest line ${index + 1} is not valid JSON.`); }
    const bundle = validateTranslationBundle(value, index + 1, { allowIncomplete: false });
    if (seen.has(bundle.contentKey)) throw new Error(`Duplicate translation contentKey: ${bundle.contentKey}.`);
    seen.add(bundle.contentKey);
    return bundle;
  });
}

export function validateTranslationBundle(
  value: unknown,
  line = 1,
  options: { allowIncomplete?: boolean } = {},
): ColdStartTranslationBundle {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Translation manifest line ${line} must be an object.`);
  }
  const bundle = value as Partial<ColdStartTranslationBundle>;
  if (bundle.version !== COLD_START_TRANSLATION_VERSION) {
    throw new Error(`Translation manifest line ${line} must use ${COLD_START_TRANSLATION_VERSION}.`);
  }
  for (const field of ["batchId", "contentKey", "sourceContentHash", "translationGroup"] as const) {
    if (typeof bundle[field] !== "string" || !bundle[field]?.trim()) {
      throw new Error(`Translation manifest line ${line} has no ${field}.`);
    }
  }
  if (!/^[a-f0-9]{64}$/.test(bundle.sourceContentHash!)) {
    throw new Error(`Translation manifest line ${line} has an invalid sourceContentHash.`);
  }
  if (bundle.translationGroup !== `site:${bundle.contentKey}`) {
    throw new Error(`Translation manifest line ${line} must use the stable site translation group.`);
  }
  if (typeof bundle.sourceMasterId !== "number" && typeof bundle.sourceMasterId !== "string") {
    throw new Error(`Translation manifest line ${line} has no sourceMasterId.`);
  }
  if (!bundle.source || typeof bundle.source !== "object") {
    throw new Error(`Translation manifest line ${line} has no Chinese source snapshot.`);
  }
  if (!bundle.source.titleZh?.trim() || !bundle.source.summaryZh?.trim()) {
    throw new Error(`Translation manifest line ${line} has an incomplete Chinese source snapshot.`);
  }
  validateBody(bundle.source.bodyZh, `line ${line} Chinese source`);
  if (!bundle.translations || typeof bundle.translations !== "object") {
    throw new Error(`Translation manifest line ${line} has no translations.`);
  }
  const translationKeys = Object.keys(bundle.translations).sort().join(",");
  if (translationKeys !== "en,es") {
    throw new Error(`Translation manifest line ${line} must contain exactly en and es.`);
  }
  for (const locale of coldStartLocales) {
    const translation = bundle.translations[locale];
    if (translation == null && options.allowIncomplete) continue;
    if (!translation) throw new Error(`Translation manifest line ${line} is missing ${locale}.`);
    validateTranslationCopy(translation, locale, bundle.source.bodyZh, line);
  }
  return bundle as ColdStartTranslationBundle;
}

export function translationStructureFingerprint(body: AgentArticleBodyV1) {
  return createHash("sha256").update(JSON.stringify(bodyStructure(body))).digest("hex");
}

export function translationSemanticHash(value: {
  body: AgentArticleBodyV1;
  editorialMaster: number | string;
  locale: ColdStartLocale;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  summary: string;
  title: string;
  translationGroup: string;
}) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function validateTranslationCopy(
  copy: TranslationCopy,
  locale: ColdStartLocale,
  sourceBody: AgentArticleBodyV1,
  line: number,
) {
  for (const field of ["title", "summary", "slug", "seoTitle", "seoDescription"] as const) {
    if (typeof copy[field] !== "string" || !copy[field].trim()) {
      throw new Error(`Translation manifest line ${line} ${locale} has no ${field}.`);
    }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(copy.slug) || copy.slug.length > 80) {
    throw new Error(`Translation manifest line ${line} ${locale} has an invalid slug.`);
  }
  if (copy.seoTitle.length > 70) throw new Error(`Translation manifest line ${line} ${locale} seoTitle exceeds 70 characters.`);
  if (copy.seoDescription.length > 180) throw new Error(`Translation manifest line ${line} ${locale} seoDescription exceeds 180 characters.`);
  validateBody(copy.body, `line ${line} ${locale}`);
  assertBodyParity(sourceBody, copy.body, `Translation manifest line ${line} ${locale}`);
  const fullText = [copy.title, copy.summary, copy.seoTitle, copy.seoDescription, bodyText(copy.body)].join("\n");
  const filler = fillerPatterns[locale].find((pattern) => pattern.test(fullText));
  if (filler) throw new Error(`Translation manifest line ${line} ${locale} contains template filler: ${filler.source}.`);
}

function validateBody(body: AgentArticleBodyV1 | undefined, label: string) {
  if (!body || body.version !== AGENT_BODY_VERSION || !Array.isArray(body.blocks) || !body.blocks.length) {
    throw new Error(`${label} body must be AgentArticleBodyV1.`);
  }
  agentBodyToLexical(body);
  for (const [index, block] of body.blocks.entries()) {
    const text = blockText(block).trim();
    if (!text) throw new Error(`${label} block ${index + 1} is empty.`);
    if (block.type === "list" && block.items.some((item) => !inlineText(item.children).trim())) {
      throw new Error(`${label} block ${index + 1} has an empty list item.`);
    }
  }
}

function assertBodyParity(source: AgentArticleBodyV1, translated: AgentArticleBodyV1, label: string) {
  const sourceStructure = bodyStructure(source);
  const translatedStructure = bodyStructure(translated);
  if (sourceStructure.length !== translatedStructure.length) {
    throw new Error(`${label} has ${translatedStructure.length} blocks; expected ${sourceStructure.length}.`);
  }
  for (let index = 0; index < sourceStructure.length; index += 1) {
    const expected = sourceStructure[index]!;
    const actual = translatedStructure[index]!;
    if (expected.type !== actual.type || expected.level !== actual.level || expected.style !== actual.style || expected.itemCount !== actual.itemCount) {
      throw new Error(`${label} block ${index + 1} does not preserve type, heading level, list style, or item count.`);
    }
    if (JSON.stringify(expected.numberTokens) !== JSON.stringify(actual.numberTokens)) {
      throw new Error(`${label} block ${index + 1} changes numeric tokens (${expected.numberTokens.join(", ")} -> ${actual.numberTokens.join(", ")}).`);
    }
    if (JSON.stringify(expected.links) !== JSON.stringify(actual.links)) {
      throw new Error(`${label} block ${index + 1} changes links.`);
    }
    const minimumLength = expected.type === "heading"
      ? Math.max(2, Math.floor(expected.textLength * 0.45))
      : Math.max(6, Math.floor(expected.textLength * 0.75));
    if (actual.textLength < minimumLength) {
      throw new Error(`${label} block ${index + 1} is too short to be a faithful translation.`);
    }
  }
}

function bodyStructure(body: AgentArticleBodyV1): StructureBlock[] {
  return body.blocks.map((block) => {
    const text = blockText(block);
    return {
      type: block.type,
      ...(block.type === "heading" ? { level: block.level } : {}),
      ...(block.type === "list" ? { itemCount: block.items.length, style: block.style } : {}),
      links: blockLinks(block),
      numberTokens: numericTokens(text),
      textLength: text.replace(/\s/g, "").length,
    };
  });
}

function numericTokens(text: string) {
  return text.match(/\d+(?:[.,:]\d+)*(?:%|h|km|GB|MB|RMB|CNY|USD|EUR)?/gi)?.map((token) => token.toLowerCase()).sort() ?? [];
}

function blockText(block: AgentBlock) {
  if (block.type === "list") return block.items.map((item) => inlineText(item.children)).join("\n");
  return inlineText(block.children);
}

function bodyText(body: AgentArticleBodyV1) {
  return body.blocks.map(blockText).join("\n");
}

function inlineText(children: AgentInline[]) {
  return children.map((inline) => {
    if (inline.type === "break") return "\n";
    if (inline.type === "link") return inline.children.map((child) => child.text).join("");
    return inline.text;
  }).join("");
}

function blockLinks(block: AgentBlock) {
  const children = block.type === "list" ? block.items.flatMap((item) => item.children) : block.children;
  return children.flatMap((inline) => inline.type === "link" ? [inline.url] : []).sort();
}
