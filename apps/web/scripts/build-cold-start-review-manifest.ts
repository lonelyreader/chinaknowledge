import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Candidate = {
  language: string;
  rights: string;
  score: number;
  source: string;
  title: string;
  url: string;
};

type CoverageTopic = {
  candidates: Candidate[];
  officialCount: number;
  purpose: string;
  risk: "evergreen" | "annual" | "volatile" | "high";
  slug: string;
  status: string;
  titleZh: string;
};

const purposeCopy: Record<string, string> = {
  business: "给准备在中国开展业务的读者，",
  live: "给准备在中国长期生活的读者，",
  study: "给准备在中国学习的读者，",
  understand: "给希望理解中国社会与日常语境的读者，",
  visit: "给准备来华旅行的读者，",
  work: "给准备在中国工作的读者，",
};

const riskCopy: Record<CoverageTopic["risk"], string> = {
  annual: "这类信息至少每年复核一次。",
  evergreen: "这类信息可以稳定保留，但具体城市和机构仍要注明。",
  high: "这类信息涉及资格、法律、费用或安全，只能在核对权威来源和日期后批准。",
  volatile: "这类信息变化快，必须标出核验日期，不能把旧流程写成当前事实。",
};

const inputArgument = process.argv.find((value) => value.startsWith("--input="));
const outputArgument = process.argv.find((value) => value.startsWith("--output="));
const reviewArgument = process.argv.find((value) => value.startsWith("--review="));
const copyArgument = process.argv.find((value) => value.startsWith("--copy="));
const inputPath = path.resolve(inputArgument?.slice("--input=".length) || "/Volumes/External/service/china-in-fact-corpus/cold-start-coverage.json");
const outputPath = path.resolve(outputArgument?.slice("--output=".length) || "/Volumes/External/service/china-in-fact-corpus/cold-start-manifest.jsonl");
const reviewPath = path.resolve(reviewArgument?.slice("--review=".length) || "/Volumes/External/service/china-in-fact-corpus/cold-start-editorial-review.md");
const copyPath = path.resolve(copyArgument?.slice("--copy=".length) || "/Volumes/External/service/china-in-fact-corpus/cold-start-chinese-copy.json");
const coverage = JSON.parse(await readFile(inputPath, "utf8")) as { generatedAt: string; topics: CoverageTopic[] };
const copyOverrides = JSON.parse(await readFile(copyPath, "utf8")) as Record<string, { bodyZh: string[]; sourceUrls?: string[]; summaryZh: string }>;
if (coverage.topics.length !== 60 || coverage.topics.some((topic) => topic.status !== "covered")) {
  throw new Error("Coverage input must contain exactly 60 covered topics.");
}

const generatedAt = new Date().toISOString();
const entries = coverage.topics.map((topic) => {
  const contentKey = `${topic.purpose}-${topic.slug}`;
  const copy = copyOverrides[contentKey];
  const sources = copy?.sourceUrls
    ? copy.sourceUrls.map((url) => {
        const source = topic.candidates.find((candidate) => candidate.url === url);
        if (!source) throw new Error(`Configured source is not in coverage candidates for ${contentKey}: ${url}`);
        return source;
      })
    : selectSources(topic.candidates);
  if (!sources.length) throw new Error(`No usable source for ${topic.purpose}/${topic.slug}.`);
  const purpose = purposeCopy[topic.purpose];
  const risk = riskCopy[topic.risk];
  const sourceNames = sources.map((source) => source.source).join("、");
  return {
    batchId: "cold-start-60-v1",
    bodyZh: copy?.bodyZh ?? [
      `${purpose}这篇候选稿围绕“${topic.titleZh}”收拢读者最可能遇到的问题，先确定适用对象、地点和时间，再整理具体做法。`,
      `${risk}中文编辑需要把不同来源中能够互相印证的事实留下，删除推广、个案外推和没有日期的结论；涉及城市差异时，正文必须明确写出差异发生在哪里。`,
      `第一轮核验来源为${sourceNames}。这些材料只用于事实核验和表达参考，不能把第三方正文直接翻译或改写后发布。`,
    ],
    contentKey,
    purpose: topic.purpose,
    risk: topic.risk,
    rightsStatus: "pending" as const,
    sourceNotes: sources.map((source) => ({
      capturedAt: coverage.generatedAt,
      checkedAt: coverage.generatedAt,
      check: `候选来源；${source.language}；score ${source.score}；进入批准前需核对正文事实与日期。`,
      label: source.title.trim(),
      rights: normalizeRights(source.rights),
      url: source.url,
    })),
    summaryZh: copy?.summaryZh ?? `${topic.titleZh}的中文候选稿，供编辑先审主题、来源和更新风险。`,
    titleZh: topic.titleZh,
    topics: [],
  };
});

const manifest = `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`;
const manifestHash = createHash("sha256").update(manifest).digest("hex");
await writeFile(outputPath, manifest, "utf8");

const grouped = Object.entries(Object.groupBy(entries, (entry) => entry.purpose));
const review = [
  "# 冷启动中文编辑入口",
  "",
  `生成时间：${generatedAt}`,
  `批次：\`cold-start-60-v1\` · 条目：${entries.length} · 中文实用稿：${Object.keys(copyOverrides).length} · manifest SHA-256：\`${manifestHash}\``,
  "",
  "这些条目现在是中文候选稿，不是可发布正文。抽审重点是题目是否值得做、来源是否够、风险是否标对。通过中文编辑后，才进入英语和西班牙语翻译与公开批次。",
  "",
  ...grouped.flatMap(([purpose, items]) => [
    `## ${purpose} · ${items!.length}`,
    "",
    ...items!.flatMap((entry) => [
      `### ${entry.titleZh}`,
      "",
      `- key：\`${entry.contentKey}\` · 状态：${copyOverrides[entry.contentKey] ? "中文实用稿" : "选题候选"} · 风险：${entry.risk} · 来源：${entry.sourceNotes.length}`,
      `- ${entry.summaryZh}`,
      `- ${entry.sourceNotes.map((source) => `[${source.label}](${source.url})`).join("；")}`,
      "",
    ]),
  ]),
].join("\n");
await writeFile(reviewPath, `${review}\n`, "utf8");
console.log(JSON.stringify({ entries: entries.length, manifestHash, outputPath, reviewPath }, null, 2));

function selectSources(candidates: Candidate[]) {
  const selected: Candidate[] = [];
  const domains = new Set<string>();
  for (const candidate of [...candidates].sort((left, right) => {
    const official = Number(right.rights.includes("official")) - Number(left.rights.includes("official"));
    return official || right.score - left.score;
  })) {
    let domain: string;
    try { domain = new URL(candidate.url).hostname.replace(/^www\./, ""); }
    catch { continue; }
    if (domains.has(domain)) continue;
    selected.push(candidate);
    domains.add(domain);
    if (selected.length === 3) break;
  }
  return selected;
}

function normalizeRights(value: string) {
  if (value.includes("official")) return "official" as const;
  if (value.includes("human-expression")) return "human_reference" as const;
  return "factual_reference" as const;
}
