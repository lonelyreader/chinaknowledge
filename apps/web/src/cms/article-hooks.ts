import { randomUUID } from "node:crypto";
import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
} from "payload";
import { APIError } from "payload";

import { hasEditorialRole, isCMSUser, isSuperAdmin } from "./roles";
import {
  assertMediaApprovedForPublicUse,
  markMediaForMemberPublication,
} from "./media-policy";
import {
  assertCurationTransition,
  assertPublicationTransition,
  isCurationStatus,
  isPublicationStatus,
  type CurationStatus,
  type PublicationStatus,
} from "./workflow";

type ArticleShape = {
  author?: number | string | { id: number | string };
  body?: unknown;
  coverImage?: number | string | { id: number | string } | null;
  curationStatus?: CurationStatus;
  format?: "guide" | "reporting" | "analysis" | "first_person" | "update" | null;
  freshnessDate?: string | null;
  homepageEndsAt?: string | null;
  homepagePlacement?: "none" | "lead" | "selected";
  homepageStartsAt?: string | null;
  id: number | string;
  locale?: "en" | "es";
  owner?: number | string | { id: number | string };
  publicationStatus?: PublicationStatus;
  publishedAt?: string | null;
  slug?: string;
  sourceNotes?: { label?: string | null; url?: string | null }[] | null;
  summary?: string | null;
  title?: string;
  translationGroup?: string;
  workflowStatus?: "draft" | "submitted" | "in_review" | "changes_requested" | "approved" | "public" | "archived";
  _status?: "draft" | "published";
};

function relationID(value: number | string | { id: number | string } | null | undefined) {
  if (value && typeof value === "object") return value.id;
  return value;
}

function slugifyTitle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

async function findOwnPerson(
  userID: number | string,
  req: Parameters<CollectionBeforeValidateHook>[0]["req"],
) {
  const people = await req.payload.find({
    collection: "people",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: { user: { equals: userID } },
  });
  const person = people.docs[0];
  if (!person) throw new APIError("A member profile is required before creating an article.", 400);
  return person;
}

async function assertBylineOwnership(
  article: Partial<ArticleShape>,
  req: Parameters<CollectionBeforeChangeHook>[0]["req"],
) {
  if (!isCMSUser(req.user)) return;
  const authorID = relationID(article.author);
  if (!authorID) throw new APIError("An author profile is required.", 400);
  const person = await req.payload.findByID({
    collection: "people",
    id: authorID,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const ownerID = relationID(article.owner);
  if (relationID(person.user) !== ownerID) {
    throw new APIError("The article owner must match the original author profile.", 403);
  }
}

async function assertMemberPublicationComplete(
  article: Partial<ArticleShape>,
  req: Parameters<CollectionBeforeChangeHook>[0]["req"],
) {
  if (!article.title?.trim() || !article.body) {
    throw new APIError("Title and body are required before publication.", 400);
  }
  if (!article.locale || !article.slug?.trim()) {
    throw new APIError("Language and public URL are required before publication.", 400);
  }
  await assertBylineOwnership(article, req);
  if (article.coverImage) {
    await markMediaForMemberPublication(article.coverImage, req, "Cover image");
  }
}

async function assertCurationComplete(
  article: Partial<ArticleShape>,
  req: Parameters<CollectionBeforeChangeHook>[0]["req"],
) {
  if (article.publicationStatus !== "published") {
    throw new APIError("Only a member-public article can be selected for site distribution.", 400);
  }
  if (!article.summary?.trim()) throw new APIError("A summary is required for site distribution.", 400);
  if (!article.format) throw new APIError("A site format is required for site distribution.", 400);
  await assertMediaApprovedForPublicUse(article.coverImage, req, "Cover image");
  if (!article.sourceNotes?.length) {
    throw new APIError("At least one source is required for site distribution.", 400);
  }
  for (const source of article.sourceNotes) {
    if (!source.url) continue;
    try {
      const url = new URL(source.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsafe protocol");
    } catch {
      throw new APIError("Source links must use a valid http or https URL.", 400);
    }
  }
  if (article.format === "guide" && !article.freshnessDate) {
    throw new APIError("A freshness date is required before distributing a guide.", 400);
  }
  const authorID = relationID(article.author);
  if (!authorID) throw new APIError("An author profile is required for site distribution.", 400);
  const person = await req.payload.findByID({
    collection: "people",
    id: authorID,
    depth: 0,
    overrideAccess: true,
    req,
  });
  await assertMediaApprovedForPublicUse(person.portrait, req, "Author portrait");
}

function assertCurationWindow(article: Partial<ArticleShape>) {
  if (!article.homepagePlacement || article.homepagePlacement === "none") return;
  if (article.homepageStartsAt && article.homepageEndsAt) {
    const startsAt = new Date(article.homepageStartsAt).getTime();
    const endsAt = new Date(article.homepageEndsAt).getTime();
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) {
      throw new APIError("Homepage curation must end after it starts.", 400);
    }
  }
}

export const prepareArticle: CollectionBeforeValidateHook<ArticleShape> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data;
  if (operation === "create") {
    data.translationGroup ||= randomUUID();
    data.publicationStatus ||= "draft";
    data.curationStatus ||= "not_selected";
    data.workflowStatus ||= "draft";
    data._status = "draft";
    if (isCMSUser(req.user)) {
      const person = await findOwnPerson(req.user.id, req);
      data.owner = req.user.id;
      data.author = person.id;
    }
  }

  const title = data.title ?? originalDoc?.title;
  let slug = data.slug ?? originalDoc?.slug;
  let generatedSlug = false;
  if (!slug && title?.trim()) {
    slug = slugifyTitle(title) || `post-${String(data.translationGroup ?? originalDoc?.translationGroup).slice(0, 8)}`;
    data.slug = slug;
    generatedSlug = true;
  }

  const locale = data.locale ?? originalDoc?.locale;
  if (locale && slug) {
    const matches = await req.payload.find({
      collection: "articles",
      depth: 0,
      limit: 2,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { locale: { equals: locale } },
          { slug: { equals: slug } },
          ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
        ],
      },
    });
    if (matches.docs.length > 0 && generatedSlug) {
      data.slug = `${slug}-${String(data.translationGroup ?? originalDoc?.translationGroup).slice(0, 8)}`;
    } else if (matches.docs.length > 0) {
      throw new APIError("This URL is already used in the selected language.", 400);
    }
  }
  return data;
};

export const enforceArticleWorkflow: CollectionBeforeChangeHook<ArticleShape> = async ({
  context,
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!isCMSUser(req.user)) {
    if (context.seed === true) return data;
    throw new APIError("Authentication is required.", 401);
  }

  if (operation === "create") {
    data.owner = req.user.id;
    data.author = (await findOwnPerson(req.user.id, req)).id;
    await assertBylineOwnership(data, req);
    data.publicationStatus = "draft";
    data.curationStatus = "not_selected";
    data.workflowStatus = "draft";
    data._status = "draft";
    return data;
  }
  if (!originalDoc) return data;

  const currentPublication = originalDoc.publicationStatus ?? "draft";
  const nextPublication = data.publicationStatus ?? currentPublication;
  const currentCuration = originalDoc.curationStatus ?? "not_selected";
  let nextCuration = data.curationStatus ?? currentCuration;
  if (!isPublicationStatus(currentPublication) || !isPublicationStatus(nextPublication)) {
    throw new APIError("Unknown publication status.", 400);
  }
  if (!isCurationStatus(currentCuration) || !isCurationStatus(nextCuration)) {
    throw new APIError("Unknown curation status.", 400);
  }

  const ownerID = relationID(originalDoc.owner);
  const ownerAction = ownerID === req.user.id;
  if (!hasEditorialRole(req.user) && !ownerAction) {
    throw new APIError("Members can only update their own content.", 403);
  }
  await assertBylineOwnership({ ...originalDoc, ...data }, req);
  assertCurationWindow({ ...originalDoc, ...data });

  if (nextPublication !== currentPublication) {
    if (!ownerAction && !isSuperAdmin(req.user)) {
      throw new APIError("Only the member or a Super Admin can change personal publication.", 403);
    }
    assertPublicationTransition(currentPublication, nextPublication);
  }
  if (nextCuration !== currentCuration) {
    if (!hasEditorialRole(req.user)) {
      throw new APIError("Only an Editor can change site curation.", 403);
    }
    assertCurationTransition(currentCuration, nextCuration);
  }

  if (context.memberPublicationConfirmed === true && nextPublication === "published") {
    await assertMemberPublicationComplete({ ...originalDoc, ...data }, req);
    data.publishedAt ||= originalDoc.publishedAt ?? new Date().toISOString();
    data._status = "published";
    if (ownerAction && currentCuration === "curated") {
      data.curationStatus = "needs_recheck";
      nextCuration = "needs_recheck";
    }
  }
  if (nextPublication === "withdrawn") {
    data._status = "draft";
    if (currentCuration !== "not_selected" && currentCuration !== "removed") {
      data.curationStatus = "removed";
      nextCuration = "removed";
    }
  }
  if (nextCuration === "curated") {
    await assertCurationComplete({ ...originalDoc, ...data, curationStatus: nextCuration }, req);
    data._status = "published";
  }
  return data;
};

export const recordWorkflowEvent: CollectionAfterChangeHook<ArticleShape> = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (context.skipWorkflowEvent === true) return doc;
  const changes = [
    {
      axis: "publication" as const,
      from: operation === "create" ? null : previousDoc.publicationStatus ?? "draft",
      to: doc.publicationStatus ?? "draft",
    },
    {
      axis: "curation" as const,
      from: operation === "create" ? null : previousDoc.curationStatus ?? "not_selected",
      to: doc.curationStatus ?? "not_selected",
    },
  ].filter(({ from, to }) => operation === "create" || from !== to);

  for (const change of changes) {
    await req.payload.create({
      collection: "workflow-events",
      context: { skipWorkflowEvent: true },
      data: {
        article: Number(doc.id),
        actor: isCMSUser(req.user) ? Number(req.user.id) : undefined,
        axis: change.axis,
        fromStatus: change.from,
        toStatus: change.to,
        occurredAt: new Date().toISOString(),
      },
      overrideAccess: true,
      req,
    });
  }
  return doc;
};
