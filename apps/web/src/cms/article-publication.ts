import { APIError, type Payload, type PayloadRequest } from "payload";

import type { Article } from "@/payload-types";

import {
  assertMediaAllowedForMemberPublication,
  markMediaForMemberPublication,
  type MediaRelation,
} from "./media-policy";
import { hasEditorialRole, isCMSUser } from "./roles";
import {
  assertPublicationTransition,
  type CurationStatus,
  type PublicationStatus,
} from "./workflow";

type ArticleShape = {
  author?: unknown;
  authorshipType?: "member" | "site" | null;
  body?: unknown;
  coverImage?: MediaRelation;
  editorialMaster?: unknown;
  id: number | string;
  locale?: "en" | "es";
  owner?: unknown;
  slug?: string;
  title?: string;
};

export function articleRelationID(value: unknown): number | null | undefined {
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

function relationIDs(values: unknown[] | null | undefined) {
  return values?.flatMap((value) => {
    const id = articleRelationID(value);
    return typeof id === "number" ? [id] : [];
  });
}

function memberPromotableArticleData(article: Article) {
  return {
    body: article.body,
    coverImage: articleRelationID(article.coverImage),
    summary: article.summary,
    title: article.title,
  };
}

function editorialPromotableArticleData(article: Article) {
  return {
    assignedEditor: articleRelationID(article.assignedEditor),
    body: article.body,
    coverImage: articleRelationID(article.coverImage),
    editorComments: article.editorComments,
    format: article.format,
    freshnessDate: article.freshnessDate,
    geographies: relationIDs(article.geographies),
    homepageEndsAt: article.homepageEndsAt,
    homepagePlacement: article.homepagePlacement,
    homepageStartsAt: article.homepageStartsAt,
    purposes: relationIDs(article.purposes),
    relatedPeople: relationIDs(article.relatedPeople),
    seo: article.seo,
    situations: relationIDs(article.situations),
    sourceNotes: article.sourceNotes,
    summary: article.summary,
    title: article.title,
    topics: relationIDs(article.topics),
  };
}

export async function getLatestDraftData(
  payload: Payload,
  id: number | string,
  fallback: Article,
  req?: PayloadRequest,
  axis: "publication" | "curation" = "publication",
) {
  const article = await getLatestDraftArticle(payload, id, fallback, req);
  return axis === "publication"
    ? memberPromotableArticleData(article)
    : editorialPromotableArticleData(article);
}

export async function getLatestDraftArticle(
  payload: Payload,
  id: number | string,
  fallback: Article,
  req?: PayloadRequest,
) {
  const versions = await payload.findVersions({
    collection: "articles",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    sort: "-updatedAt",
    where: {
      and: [
        { parent: { equals: id } },
        { latest: { equals: true } },
      ],
    },
  });
  const latest = versions.docs[0]?.version;
  return latest ? { ...latest, id: fallback.id } as Article : fallback;
}

export async function assertArticleBylineOwnership(
  article: ArticleShape,
  req: PayloadRequest,
) {
  if (!isCMSUser(req.user)) throw new APIError("Authentication is required.", 401);
  if (article.authorshipType === "site") {
    if (!hasEditorialRole(req.user)) throw new APIError("Editor access is required for site content.", 403);
    if (articleRelationID(article.author)) throw new APIError("Site content cannot use a Person byline.", 400);
    const masterID = articleRelationID(article.editorialMaster);
    if (!masterID) throw new APIError("An approved Chinese master is required for site content.", 400);
    const master = await req.payload.findByID({
      collection: "editorial-masters",
      id: masterID,
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
    });
    if (!master || !["approved", "translated", "released"].includes(master.editorialStatus) || master.rightsStatus !== "cleared") {
      throw new APIError("The Chinese master must be approved and rights-cleared.", 400);
    }
    return null;
  }
  const authorID = articleRelationID(article.author);
  if (!authorID) throw new APIError("An author profile is required.", 400);
  const person = await req.payload.findByID({
    collection: "people",
    id: authorID,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const ownerID = articleRelationID(article.owner);
  if (articleRelationID(person.user) !== ownerID) {
    throw new APIError("The article owner must match the original author profile.", 403);
  }
  return person;
}

export async function assertMemberPublicationComplete(
  article: ArticleShape,
  req: PayloadRequest,
  options: { markMedia: boolean },
) {
  if (!article.title?.trim() || !article.body) {
    throw new APIError("Title and body are required before publication.", 400);
  }
  if (!article.locale || !article.slug?.trim()) {
    throw new APIError("Language and public URL are required before publication.", 400);
  }
  const person = await assertArticleBylineOwnership(article, req);
  if (article.authorshipType === "site") return;
  if (!person) throw new APIError("An author profile is required.", 400);
  if (person.profileStatus !== "public" || !person.profilePublishedAt) {
    throw new APIError("Publish your profile before publishing an article.", 400);
  }
  if (!person.languages?.includes(article.locale)) {
    throw new APIError("Add this article language to your public profile before publishing.", 400);
  }
  if (article.coverImage) {
    if (options.markMedia) {
      await markMediaForMemberPublication(article.coverImage, req, "Cover image");
    } else {
      await assertMediaAllowedForMemberPublication(article.coverImage, req, "Cover image");
    }
  }
}

export type MemberPublicationAction = "publish" | "republish" | "update_public" | "withdraw";

export function memberPublicationAction(
  current: PublicationStatus,
  target: "published" | "withdrawn",
): MemberPublicationAction {
  assertPublicationTransition(current, target);
  if (target === "withdrawn") return "withdraw";
  if (current === "draft") return "publish";
  if (current === "withdrawn") return "republish";
  return "update_public";
}

export function publicationCurationAfter(
  article: Pick<Article, "curationStatus" | "publicationStatus">,
  target: "published" | "withdrawn",
): CurationStatus {
  const current = article.curationStatus ?? "not_selected";
  if (target === "withdrawn") {
    return current === "not_selected" || current === "removed" ? current : "removed";
  }
  if (article.publicationStatus === "published" && current === "curated") return "needs_recheck";
  return current;
}

export async function prepareMemberPublication(
  article: Article,
  target: "published" | "withdrawn",
  req: PayloadRequest,
) {
  const current = article.publicationStatus ?? "draft";
  const action = memberPublicationAction(current, target);
  if (target === "published") {
    const promotable = await getLatestDraftData(req.payload, article.id, article, req);
    await assertMemberPublicationComplete({ ...article, ...promotable }, req, { markMedia: false });
  }
  return {
    action,
    currentStatus: current,
    curationAfter: publicationCurationAfter(article, target),
    curationBefore: article.curationStatus ?? "not_selected",
    publicPath: `/${article.locale}/posts/${article.slug}`,
    targetStatus: target,
  };
}

export async function commitMemberPublication(
  article: Article,
  target: "published" | "withdrawn",
  req: PayloadRequest,
) {
  memberPublicationAction(article.publicationStatus ?? "draft", target);
  const unpublishing = article.publicationStatus === "published" && target !== "published";
  const promotedData = target === "published"
    ? await getLatestDraftData(req.payload, article.id, article, req)
    : undefined;
  return req.payload.update({
    collection: "articles",
    id: article.id,
    context: {
      memberPublicationConfirmed: target === "published",
      publicationTransitionConfirmed: true,
    },
    data: {
      ...promotedData,
      publicationStatus: target,
      ...(unpublishing ? { _status: "draft" as const } : {}),
    },
    ...(unpublishing ? {} : { draft: target !== "published" }),
    overrideAccess: false,
    req,
  });
}
