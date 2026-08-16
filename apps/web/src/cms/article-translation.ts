import { APIError, type PayloadRequest } from "payload";

import type { Article } from "@/payload-types";

import { hasEditorialRole, isCMSUser } from "./roles";

function relationID(value: unknown): number | null | undefined {
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "number") return id;
    if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
    return undefined;
  }
  if (typeof value === "number" || value === null) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return undefined;
}

export async function createArticleTranslationDraft(sourceID: number | string, req: PayloadRequest) {
  if (!isCMSUser(req.user)) throw new APIError("Authentication is required.", 401);
  const source = await req.payload.findByID({
    collection: "articles",
    id: sourceID,
    depth: 0,
    draft: true,
    overrideAccess: true,
    req,
  }) as Article;
  if (source.authorshipType === "site") {
    if (!hasEditorialRole(req.user)) throw new APIError("Editor access is required.", 403);
    throw new APIError("Site translations are created from the approved Chinese master.", 409);
  }
  if (relationID(source.owner) !== req.user.id) {
    throw new APIError("Only the member can add a translation of this article.", 403);
  }

  const targetLocale = source.locale === "es" ? "en" : "es";
  const existing = await req.payload.find({
    collection: "articles",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        { translationGroup: { equals: source.translationGroup } },
        { locale: { equals: targetLocale } },
      ],
    },
  });
  if (existing.docs[0]) {
    const paired = existing.docs[0] as Article;
    if (paired.authorshipType === "site" || relationID(paired.owner) !== req.user.id) {
      throw new APIError("The existing translation pair is not owned by the current member.", 403);
    }
    return { article: paired, created: false };
  }

  const slugMatches = await req.payload.count({
    collection: "articles",
    overrideAccess: true,
    req,
    where: {
      and: [
        { locale: { equals: targetLocale } },
        { slug: { equals: source.slug } },
      ],
    },
  });
  const article = await req.payload.create({
    collection: "articles",
    data: {
      body: source.body,
      coverImage: relationID(source.coverImage),
      locale: targetLocale,
      slug: slugMatches.totalDocs === 0 ? source.slug : `${source.slug}-${targetLocale}`,
      summary: source.summary,
      title: source.title,
      translationGroup: source.translationGroup,
    },
    draft: true,
    overrideAccess: false,
    req,
  }) as Article;
  return { article, created: true };
}
