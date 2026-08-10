import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const templateArgument = process.argv.find((value) => value.startsWith("--template="));
const copyArgument = process.argv.find((value) => value.startsWith("--copy="));
const cacheArgument = process.argv.find((value) => value.startsWith("--cache="));
const portArgument = process.argv.find((value) => value.startsWith("--port="));
const limitArgument = process.argv.find((value) => value.startsWith("--limit="));
const templatePath = path.resolve(templateArgument?.slice("--template=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-60-translation-template.jsonl");
const copyPath = path.resolve(copyArgument?.slice("--copy=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-60-translation-copy.json");
const cachePath = path.resolve(cacheArgument?.slice("--cache=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-chrome-translation-cache.json");
const port = Number(portArgument?.slice("--port=".length) || 9333);
const limit = Number(limitArgument?.slice("--limit=".length) || 0);
const locales = ["en", "es"];
const batchSize = 40;

async function main() {
  const templates = (await readFile(templatePath, "utf8")).trim().split(/\r?\n/).map(JSON.parse);
  const existing = JSON.parse(await readFile(copyPath, "utf8"));
  const existingByKey = new Map(existing.map((entry) => [entry.contentKey, entry]));
  let pending = templates.filter((template) => !existingByKey.has(template.contentKey));
  if (limit > 0) pending = pending.slice(0, limit);
  const cache = await readJSON(cachePath, {});

if (pending.length) {
  const page = await chromePage(port);
  const cdp = await CDP.connect(page.webSocketDebuggerUrl);
  try {
    await cdp.evaluate(`(async () => {
      globalThis.__cifTranslators ??= {};
      for (const locale of ${JSON.stringify(locales)}) {
        globalThis.__cifTranslators[locale] ??= await Translator.create({
          sourceLanguage: "zh",
          targetLanguage: locale,
        });
      }
      return Object.keys(globalThis.__cifTranslators);
    })()`, { timeout: 300_000, userGesture: true });

    for (const locale of locales) {
      const sourceTexts = pending.flatMap((template) => sourceTextSlots(template)).flatMap(segmentText);
      const missing = [...new Set(sourceTexts.filter((text) => !cache[cacheKey(locale, text)]))];
      for (let offset = 0; offset < missing.length; offset += batchSize) {
        const sourceBatch = missing.slice(offset, offset + batchSize);
        const protectedBatch = sourceBatch.map(protectTokens);
        const translated = await cdp.evaluate(`(async () => {
          const output = [];
          for (const text of ${JSON.stringify(protectedBatch.map((item) => item.text))}) {
            output.push(await globalThis.__cifTranslators[${JSON.stringify(locale)}].translate(text));
          }
          return output;
        })()`, { timeout: 300_000 });
        if (!Array.isArray(translated) || translated.length !== sourceBatch.length) {
          throw new Error(`Chrome returned an incomplete ${locale} translation batch.`);
        }
        for (let index = 0; index < sourceBatch.length; index += 1) {
          try {
            cache[cacheKey(locale, sourceBatch[index])] = restoreTokens(translated[index], protectedBatch[index].tokens);
          } catch (error) {
            throw new Error(`${error.message}\nSource: ${sourceBatch[index]}\nProtected: ${protectedBatch[index].text}\nTranslated: ${translated[index]}`);
          }
        }
        await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
        console.log(`${locale} ${Math.min(offset + batchSize, missing.length)}/${missing.length}`);
      }
    }
  } finally {
    cdp.close();
  }
}

for (const template of pending) {
  const translations = Object.fromEntries(locales.map((locale) => {
    const title = translated(locale, template.source.titleZh);
    const summary = translated(locale, template.source.summaryZh);
    return [locale, {
      title,
      summary,
      slug: uniqueSlug(slugify(title), locale, template.contentKey),
      seoTitle: shorten(title, 70),
      seoDescription: shorten(summary, 180),
      blocks: template.source.bodyZh.blocks.map((block) => block.type === "list"
        ? block.items.map((item) => translated(locale, plainText(item.children)))
        : translated(locale, plainText(block.children))),
    }];
  }));
  existingByKey.set(template.contentKey, {
    version: "ColdStartTranslationCopyV1",
    contentKey: template.contentKey,
    translations,
  });
}

  const output = templates.map((template) => existingByKey.get(template.contentKey)).filter(Boolean);
  await writeFile(copyPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ added: pending.length, cacheEntries: Object.keys(cache).length, copyPath, total: output.length }, null, 2));

  function translated(locale, source) {
    return segmentText(source).map((segment) => {
      const value = cache[cacheKey(locale, segment)];
      if (!value) throw new Error(`Missing ${locale} translation cache for: ${segment.slice(0, 80)}`);
      return value.trim();
    }).join(" ");
  }
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

function segmentText(text) {
  const segments = text.match(/[^。；！？!?;]+[。；！？!?;]?/g)?.map((segment) => segment.trim()).filter(Boolean) ?? [];
  return segments.length ? segments : [text];
}

function plainText(children) {
  return children.map((inline) => inline.type === "break"
    ? "\n"
    : inline.type === "link"
      ? inline.children.map((child) => child.text).join("")
      : inline.text).join("");
}

function protectTokens(text) {
  const tokens = [];
  const patterns = [
    /https?:\/\/[^\s`]+/gi,
    /\b[A-Z][A-Z0-9]*\d[A-Z0-9]*\b/g,
    /\d+(?:[.,:]\d+)*(?:%|h|km|GB|MB|RMB|CNY|USD|EUR)?/gi,
  ];
  let protectedText = text;
  for (const pattern of patterns) {
    protectedText = protectedText.replace(pattern, (token) => {
      const placeholder = `[CIF_${alpha(tokens.length)}]`;
      tokens.push({ placeholder, token });
      return placeholder;
    });
  }
  return { text: protectedText, tokens };
}

function restoreTokens(text, tokens) {
  let restored = text;
  for (const { placeholder, token } of tokens) {
    const pattern = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    if (!pattern.test(restored)) restored = `${restored} ${placeholder}`;
    restored = restored.replace(pattern, token);
  }
  if (/\[CIF_[A-Z]+\]/i.test(restored)) throw new Error("Chrome translation left an unknown protected token.");
  return restored;
}

function alpha(value) {
  let number = value + 1;
  let output = "";
  while (number > 0) {
    number -= 1;
    output = String.fromCharCode(65 + (number % 26)) + output;
    number = Math.floor(number / 26);
  }
  return output;
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
  if (!page) throw new Error("No localhost Chrome page is available for translation.");
  return page;
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
      pending.reject(new Error(message.result?.exceptionDetails?.text || message.error?.message || result?.description || "Chrome evaluation failed."));
      return;
    }
    pending.resolve(result?.value);
  }

  close() {
    this.socket.close();
  }
}

await main();
