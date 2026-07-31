import { createHash } from "node:crypto";

export type ArticleRevisionSource = {
  id: number | string;
  locale: string;
  updatedAt: string;
};

function canonicalJSON(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJSON(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function relationID(value: unknown) {
  if (value && typeof value === "object" && "id" in value) {
    return (value as { id?: unknown }).id ?? null;
  }
  return value ?? null;
}

function relationIDs(value: unknown) {
  return Array.isArray(value) ? value.map(relationID) : [];
}

export function createArticleRevision<T extends ArticleRevisionSource>(source: T) {
  const article = source as T & Record<string, unknown>;
  const revisionState = {
    id: source.id,
    locale: source.locale,
    updatedAt: source.updatedAt,
    title: article.title ?? null,
    summary: article.summary ?? null,
    body: article.body ?? null,
    coverImage: relationID(article.coverImage),
    slug: article.slug ?? null,
    owner: relationID(article.owner),
    author: relationID(article.author),
    translationGroup: article.translationGroup ?? null,
    publicationStatus: article.publicationStatus ?? null,
    curationStatus: article.curationStatus ?? null,
    workflowStatus: article.workflowStatus ?? null,
    payloadStatus: article._status ?? null,
    publishedAt: article.publishedAt ?? null,
    assignedEditor: relationID(article.assignedEditor),
    editorComments: article.editorComments ?? null,
    format: article.format ?? null,
    freshnessDate: article.freshnessDate ?? null,
    geographies: relationIDs(article.geographies),
    homepageEndsAt: article.homepageEndsAt ?? null,
    homepagePlacement: article.homepagePlacement ?? null,
    homepageStartsAt: article.homepageStartsAt ?? null,
    purposes: relationIDs(article.purposes),
    situations: relationIDs(article.situations),
    sourceNotes: article.sourceNotes ?? null,
    topics: relationIDs(article.topics),
  };
  const digest = createHash("sha256")
    .update(`article\0${canonicalJSON(revisionState)}`)
    .digest("base64url");
  return `rev1_${digest}`;
}

export function articleRevisionMatches<T extends ArticleRevisionSource>(revision: string, source: T) {
  return revision === createArticleRevision(source);
}
