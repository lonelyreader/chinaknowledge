import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const templateArgument = process.argv.find((value) => value.startsWith("--template="));
const copyArgument = process.argv.find((value) => value.startsWith("--copy="));
const cacheArgument = process.argv.find((value) => value.startsWith("--cache="));
const portArgument = process.argv.find((value) => value.startsWith("--port="));
const preserveArgument = process.argv.find((value) => value.startsWith("--preserve="));
const localesArgument = process.argv.find((value) => value.startsWith("--locales="));
const limitArgument = process.argv.find((value) => value.startsWith("--limit="));
const templatePath = path.resolve(templateArgument?.slice("--template=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-60-translation-template.jsonl");
const copyPath = path.resolve(copyArgument?.slice("--copy=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-60-translation-copy.json");
const cachePath = path.resolve(cacheArgument?.slice("--cache=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-language-model-translation-cache.json");
const port = Number(portArgument?.slice("--port=".length) || 9333);
const limit = Number(limitArgument?.slice("--limit=".length) || 0);
const preserve = new Set((preserveArgument?.slice("--preserve=".length) || "")
  .split(",").map((value) => value.trim()).filter(Boolean));
const locales = (localesArgument?.slice("--locales=".length) || "en,es")
  .split(",").map((value) => value.trim()).filter((value) => ["en", "es"].includes(value));
if (!locales.length) throw new Error("--locales must contain en, es, or both.");
const englishOnly = locales.length === 1 && locales[0] === "en";
const maxBatchItems = englishOnly ? 15 : 5;
const maxBatchCharacters = englishOnly ? 3_000 : 1_100;

async function main() {
  let templates = (await readFile(templatePath, "utf8")).trim().split(/\r?\n/).map(JSON.parse);
  if (limit > 0) templates = templates.slice(0, limit);
  const existing = JSON.parse(await readFile(copyPath, "utf8"));
  const existingByKey = new Map(existing.map((entry) => [entry.contentKey, entry]));
  const cache = await readJSON(cachePath, {});
  let page = await chromePage(port);
  let cdp = await CDP.connect(page.webSocketDebuggerUrl);

  const resilientTranslateBatch = async (locale, sourceBatch, correction = "") => {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await translateBatch(cdp, locale, sourceBatch, correction);
      } catch (error) {
        lastError = error;
        if (attempt === 3) throw error;
        console.log(`${locale} browser session failed (${String(error?.message).split("\n")[0]}); resetting target and retrying ${attempt}/3`);
        cdp.close();
        await closeChromePage(port, page.id);
        page = await openChromePage(port);
        cdp = await CDP.connect(page.webSocketDebuggerUrl);
        if (sourceBatch.length > 1) {
          console.log(`${locale} splitting the failed batch into ${sourceBatch.length} single-string requests`);
          const output = [];
          for (const source of sourceBatch) output.push(...await resilientTranslateBatch(locale, [source], correction));
          return output;
        }
      }
    }
    throw lastError;
  };

  try {
    for (const locale of locales) {
      const sourceTexts = [...new Set(templates
        .filter((template) => !preserve.has(template.contentKey))
        .flatMap(sourceTextSlots))];
      const missing = sourceTexts.filter((text) => !cache[cacheKey(locale, text)]);
      const batches = makeBatches(missing);
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
        const sourceBatch = batches[batchIndex];
        console.log(`${locale} starting ${batchIndex + 1}/${batches.length}; ${sourceBatch.length} strings; ${sourceBatch.reduce((sum, text) => sum + text.length, 0)} source characters`);
        const translatedBatch = await resilientTranslateBatch(locale, sourceBatch);
        for (let index = 0; index < sourceBatch.length; index += 1) {
          const source = sourceBatch[index];
          let translated = translatedBatch[index]?.trim();
          let error = parityError(source, translated);
          for (let attempt = 1; error && attempt <= 2; attempt += 1) {
            console.log(`${locale} parity retry ${attempt}: ${error}`);
            translated = (await resilientTranslateBatch(locale, [source], error))[0]?.trim();
            error = parityError(source, translated);
          }
          if (error) throw new Error(`${locale} translation parity failed: ${error}\nSource: ${source}\nTranslation: ${translated}`);
          cache[cacheKey(locale, source)] = translated;
        }
        await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
        console.log(`${locale} ${batchIndex + 1}/${batches.length} batches; ${Object.keys(cache).length} cached strings`);
      }
    }
  } finally {
    cdp.close();
  }

  for (const template of templates) {
    if (preserve.has(template.contentKey)) continue;
    const current = existingByKey.get(template.contentKey);
    const translations = { ...(current?.translations ?? {}) };
    for (const locale of locales) {
      const title = translated(cache, locale, template.source.titleZh);
      const summary = translated(cache, locale, template.source.summaryZh);
      translations[locale] = {
        title,
        summary,
        slug: uniqueSlug(slugify(title), locale, template.contentKey),
        seoTitle: shorten(title, 70),
        seoDescription: shorten(summary, 180),
        blocks: template.source.bodyZh.blocks.map((block) => block.type === "list"
          ? block.items.map((item) => translated(cache, locale, plainText(item.children)))
          : translated(cache, locale, plainText(block.children))),
      };
    }
    existingByKey.set(template.contentKey, {
      version: "ColdStartTranslationCopyV1",
      contentKey: template.contentKey,
      translations,
    });
  }

  const fullTemplates = (await readFile(templatePath, "utf8")).trim().split(/\r?\n/).map(JSON.parse);
  const output = fullTemplates.map((template) => existingByKey.get(template.contentKey)).filter(Boolean);
  await writeFile(copyPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ cacheEntries: Object.keys(cache).length, copyPath, processed: templates.length, total: output.length }, null, 2));
}

async function translateBatch(cdp, locale, sourceBatch, correction = "") {
  const language = locale === "en" ? "natural editorial English" : "natural standard Spanish";
  const system = [
    `You translate practical guides about China into ${language}.`,
    "Translate faithfully and naturally. Preserve every fact, qualification, condition, proper noun, URL, Arabic numeric token and alphanumeric code.",
    "Do not add, omit, summarize, explain or turn Chinese numeral words into Arabic digits.",
    "Return one translation for each source string in the same order.",
  ].join(" ");
  const prompt = [
    correction ? `Correction required: ${correction}` : "",
    "Translate this JSON array:",
    JSON.stringify(sourceBatch.map(normalizeChineseDates)),
  ].filter(Boolean).join("\n\n");
  const schema = {
    type: "array",
    items: { type: "string", minLength: 1 },
    minItems: sourceBatch.length,
    maxItems: sourceBatch.length,
  };
  const expression = `(async () => {
    const session = await LanguageModel.create({ initialPrompts: [{ role: "system", content: ${JSON.stringify(system)} }] });
    try {
      const result = await session.prompt(${JSON.stringify(prompt)}, {
        responseConstraint: ${JSON.stringify(schema)},
        omitResponseConstraintInput: true,
      });
      return JSON.parse(result);
    } finally {
      session.destroy();
    }
  })()`;
  const output = await cdp.evaluate(expression, { timeout: 120_000, userGesture: true });
  if (!Array.isArray(output) || output.length !== sourceBatch.length || output.some((value) => typeof value !== "string")) {
    throw new Error(`LanguageModel returned an invalid ${locale} batch.`);
  }
  return output;
}

function normalizeChineseDates(text) {
  return text.replace(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g, "$1-$2-$3");
}

function sourceTextSlots(template) {
  return [
    template.source.titleZh,
    template.source.summaryZh,
    ...template.source.bodyZh.blocks.flatMap((block) => block.type === "list"
      ? block.items.map((item) => plainText(item.children))
      : [plainText(block.children)]),
  ];
}

function plainText(children) {
  return children.map((inline) => inline.type === "break"
    ? "\n"
    : inline.type === "link"
      ? inline.children.map((child) => child.text).join("")
      : inline.text).join("");
}

function makeBatches(texts) {
  const batches = [];
  let current = [];
  let characters = 0;
  for (const text of texts) {
    if (current.length && (current.length >= maxBatchItems || characters + text.length > maxBatchCharacters)) {
      batches.push(current);
      current = [];
      characters = 0;
    }
    current.push(text);
    characters += text.length;
  }
  if (current.length) batches.push(current);
  return batches;
}

function parityError(source, translatedText) {
  if (!translatedText) return "the translation is empty";
  const sourceNumbers = numericTokens(source);
  const translatedNumbers = numericTokens(translatedText);
  if (JSON.stringify(sourceNumbers) !== JSON.stringify(translatedNumbers)) {
    return `The source contains the meaningful Arabic-digit tokens ${JSON.stringify(sourceNumbers)}, but the translation contains ${JSON.stringify(translatedNumbers)}. Include every source token naturally in its original semantic place and keep it as Arabic digits. Do not spell those tokens out. Do not introduce other digits`;
  }
  const sourceURLs = urls(source);
  const translatedURLs = urls(translatedText);
  if (JSON.stringify(sourceURLs) !== JSON.stringify(translatedURLs)) {
    return `URLs must be exactly ${JSON.stringify(sourceURLs)}, but were ${JSON.stringify(translatedURLs)}`;
  }
  return "";
}

function numericTokens(text) {
  return text.match(/\d+(?:[.,:]\d+)*(?:%|h|km|GB|MB|RMB|CNY|USD|EUR)?/gi)?.map((token) => token.toLowerCase()).sort() ?? [];
}

function urls(text) {
  return text.match(/https?:\/\/[^\s`]+/gi)?.sort() ?? [];
}

function translated(cache, locale, source) {
  const value = cache[cacheKey(locale, source)];
  if (!value) throw new Error(`Missing ${locale} language-model translation for: ${source.slice(0, 80)}`);
  return value;
}

function cacheKey(locale, text) {
  return `${locale}:${createHash("sha256").update(text).digest("hex")}`;
}

function slugify(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72).replace(/-+$/g, "");
}

function uniqueSlug(candidate, locale, contentKey) {
  const fallback = contentKey.replace(/^wave-[abc]-/, "");
  const base = candidate || fallback;
  return `${base}-${locale}`.slice(0, 80).replace(/-+$/g, "");
}

function shorten(value, max) {
  if (value.length <= max) return value;
  const clipped = value.slice(0, max);
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, boundary > max * 0.65 ? boundary : max - 1).replace(/[,:;\s]+$/g, "")}…`;
}

async function readJSON(filePath, fallback) {
  try { return JSON.parse(await readFile(filePath, "utf8")); }
  catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

async function chromePage(debugPort) {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
  if (!response.ok) throw new Error(`Chrome DevTools endpoint returned ${response.status}.`);
  const pages = await response.json();
  const page = pages.find((candidate) => candidate.type === "page" && candidate.url.startsWith("http://127.0.0.1"));
  if (!page) throw new Error("No localhost Chrome page is available for language-model translation.");
  return page;
}

async function closeChromePage(debugPort, targetID) {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/close/${targetID}`);
  if (!response.ok) throw new Error(`Chrome could not close timed-out target ${targetID}.`);
}

async function openChromePage(debugPort) {
  const url = encodeURIComponent("http://127.0.0.1:4312/wave-a-20-chinese-review.html");
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?${url}`, { method: "PUT" });
  if (!response.ok) throw new Error(`Chrome could not create a replacement translation target (${response.status}).`);
  return response.json();
}

class CDP {
  static async connect(url) {
    const client = new CDP(new WebSocket(url));
    await new Promise((resolve, reject) => {
      client.socket.onopen = resolve;
      client.socket.onerror = reject;
    });
    client.socket.onmessage = (event) => client.receive(JSON.parse(event.data));
    return client;
  }

  constructor(socket) {
    this.socket = socket;
    this.nextID = 1;
    this.pending = new Map();
  }

  evaluate(expression, { timeout = 60_000, userGesture = false } = {}) {
    return new Promise((resolve, reject) => {
      const id = this.nextID++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Chrome evaluation ${id} timed out.`));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({
        id,
        method: "Runtime.evaluate",
        params: { expression, awaitPromise: true, returnByValue: true, userGesture },
      }));
    });
  }

  receive(message) {
    const pending = this.pending.get(message.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending.delete(message.id);
    const result = message.result?.result;
    if (message.error || result?.subtype === "error" || message.result?.exceptionDetails) {
      pending.reject(new Error(message.result?.exceptionDetails?.exception?.description
        || message.result?.exceptionDetails?.text || message.error?.message || result?.description || "Chrome evaluation failed."));
      return;
    }
    pending.resolve(result?.value);
  }

  close() {
    this.socket.close();
  }
}

await main();
