import { createHash } from "node:crypto";

export type ArticleRevisionSource = {
  id: number | string;
  locale: string;
  updatedAt: string;
};

export function createArticleRevision(source: ArticleRevisionSource) {
  const digest = createHash("sha256")
    .update(`article\0${String(source.id)}\0${source.locale}\0${source.updatedAt}`)
    .digest("base64url");
  return `rev1_${digest}`;
}

export function articleRevisionMatches(revision: string, source: ArticleRevisionSource) {
  return revision === createArticleRevision(source);
}
