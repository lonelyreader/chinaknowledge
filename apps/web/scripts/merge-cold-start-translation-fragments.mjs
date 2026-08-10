import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseArgument = process.argv.find((value) => value.startsWith("--base="));
const templateArgument = process.argv.find((value) => value.startsWith("--template="));
const outputArgument = process.argv.find((value) => value.startsWith("--output="));
const fragmentPaths = process.argv.slice(2).filter((value) => !value.startsWith("--")).map((value) => path.resolve(value));
const basePath = path.resolve(baseArgument?.slice("--base=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-60-translation-copy.json");
const templatePath = path.resolve(templateArgument?.slice("--template=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-60-translation-template.jsonl");
const outputPath = path.resolve(outputArgument?.slice("--output=".length)
  || "/Volumes/External/service/china-in-fact-corpus/cold-start-60-translation-copy.gpt-5.6.json");

if (!fragmentPaths.length) throw new Error("At least one translation fragment is required.");

const base = parseArray(await readFile(basePath, "utf8"), basePath);
const templates = (await readFile(templatePath, "utf8"))
  .split(/\r?\n/)
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line));
const orderedKeys = templates.map((entry) => entry.contentKey);
const expectedKeys = new Set(orderedKeys);
const merged = new Map(base.map((entry) => [entry.contentKey, entry]));
const replaced = new Set();

for (const fragmentPath of fragmentPaths) {
  for (const entry of parseArray(await readFile(fragmentPath, "utf8"), fragmentPath)) {
    validateEntry(entry, fragmentPath);
    if (!expectedKeys.has(entry.contentKey)) throw new Error(`${fragmentPath} has unknown contentKey ${entry.contentKey}.`);
    if (replaced.has(entry.contentKey)) throw new Error(`Duplicate fragment contentKey ${entry.contentKey}.`);
    replaced.add(entry.contentKey);
    merged.set(entry.contentKey, entry);
  }
}

const missing = orderedKeys.filter((contentKey) => !merged.has(contentKey));
if (missing.length) throw new Error(`Merged copy is missing: ${missing.join(", ")}`);
const output = orderedKeys.map((contentKey) => merged.get(contentKey));
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  baseEntries: base.length,
  fragmentFiles: fragmentPaths.length,
  replacedEntries: replaced.size,
  outputEntries: output.length,
  outputPath,
}, null, 2));

function parseArray(raw, label) {
  const value = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error(`${label} must be a JSON array.`);
  return value;
}

function validateEntry(entry, label) {
  if (entry?.version !== "ColdStartTranslationCopyV1" || typeof entry.contentKey !== "string") {
    throw new Error(`${label} contains an invalid translation copy entry.`);
  }
  if (Object.keys(entry.translations ?? {}).sort().join(",") !== "en,es") {
    throw new Error(`${label}:${entry.contentKey} must contain exactly en and es.`);
  }
}
