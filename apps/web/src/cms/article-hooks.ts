import { randomUUID } from "node:crypto";
import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
} from "payload";
import { APIError } from "payload";

import { hasEditorialRole, isCMSUser, type Role } from "./roles";
import { assertMediaApprovedForPublicUse } from "./media-policy";
import {
  assertWorkflowTransition,
  isWorkflowStatus,
  type WorkflowStatus,
} from "./workflow";

type ArticleShape = {
  author?: number | string | { id: number | string };
  coverImage?: number | string | { id: number | string } | null;
  format?: "guide" | "reporting" | "analysis" | "first_person" | "update";
  freshnessDate?: string | null;
  homepageEndsAt?: string | null;
  homepagePlacement?: "none" | "lead" | "selected";
  homepageStartsAt?: string | null;
  id: number | string;
  locale?: "en" | "es";
  owner?: number | string | { id: number | string };
  publishedAt?: string | null;
  slug?: string;
  sourceNotes?: { label?: string | null; url?: string | null }[] | null;
  translationGroup?: string;
  workflowStatus?: WorkflowStatus;
  _status?: "draft" | "published";
};

function relationID(value: ArticleShape["owner"]) {
  if (value && typeof value === "object") return value.id;
  return value;
}

async function assertAuthorOwnership(article: Partial<ArticleShape>, req: Parameters<CollectionBeforeChangeHook>[0]["req"]) {
  if (!isCMSUser(req.user) || req.user.role !== "author") return;
  const authorID = relationID(article.author);
  if (!authorID) throw new APIError("An author profile is required.", 400);
  const person = await req.payload.findByID({
    collection: "people",
    id: authorID,
    depth: 0,
    overrideAccess: true,
    req,
  });
  if (relationID(person.user) !== req.user.id) {
    throw new APIError("Authors can only publish under their own profile.", 403);
  }
}

async function assertPublicationComplete(article: Partial<ArticleShape>, req: Parameters<CollectionBeforeChangeHook>[0]["req"]) {
  await assertMediaApprovedForPublicUse(article.coverImage, req, "Cover image");
  if (!article.sourceNotes?.length) throw new APIError("At least one source is required before publication.", 400);
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
    throw new APIError("A freshness date is required before publishing a guide.", 400);
  }
  const authorID = relationID(article.author);
  if (!authorID) throw new APIError("An author profile is required before publication.", 400);
  const person = await req.payload.findByID({
    collection: "people",
    id: authorID,
    depth: 0,
    overrideAccess: true,
    req,
  });
  if (!person.portrait) throw new APIError("The author needs a portrait before publication.", 400);
  await assertMediaApprovedForPublicUse(person.portrait, req, "Author portrait");
  if (!person.authorApprovalRecordedAt) {
    throw new APIError("Author profile approval must be recorded before publication.", 400);
  }
}

function assertCurationWindow(article: Partial<ArticleShape>) {
  if (article.homepagePlacement === "none") return;
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
    data.workflowStatus ||= "draft";
    data._status = "draft";
    if (isCMSUser(req.user) && req.user.role === "author") {
      data.owner = req.user.id;
    }
  }

  const locale = data.locale ?? originalDoc?.locale;
  const slug = data.slug ?? originalDoc?.slug;
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

    if (matches.docs.length > 0) {
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

  const role = (req.user.role ?? "author") as Role;

  if (operation === "create") {
    if (!data.owner) data.owner = req.user.id;
    if (role === "author" && relationID(data.owner) !== req.user.id) {
      throw new APIError("Authors can only create their own content.", 403);
    }
    await assertAuthorOwnership(data, req);
    assertCurationWindow(data);
    data.workflowStatus = "draft";
    data._status = "draft";
    return data;
  }

  if (!originalDoc) return data;
  const current = originalDoc.workflowStatus ?? "draft";
  const next = data.workflowStatus ?? current;
  assertCurationWindow({ ...originalDoc, ...data });

  if (!isWorkflowStatus(current) || !isWorkflowStatus(next)) {
    throw new APIError("Unknown editorial status.", 400);
  }

  if (role === "author") {
    if (relationID(originalDoc.owner) !== req.user.id) {
      throw new APIError("Authors can only update their own content.", 403);
    }
    if (current !== "draft" && current !== "changes_requested") {
      throw new APIError("This submission is currently read-only for its author.", 403);
    }
    await assertAuthorOwnership({ ...originalDoc, ...data }, req);
  }

  assertWorkflowTransition(role, current, next, context.publicationConfirmed === true);

  if (next === "public") {
    if (!hasEditorialRole(req.user)) {
      throw new APIError("Authors cannot publish content.", 403);
    }
    await assertPublicationComplete({ ...originalDoc, ...data }, req);
    data.publishedAt ||= originalDoc.publishedAt ?? new Date().toISOString();
    data._status = "published";
  } else {
    data._status = "draft";
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
  const from = operation === "create" ? null : previousDoc.workflowStatus ?? null;
  const to = doc.workflowStatus ?? "draft";
  if (from === to && operation !== "create") return doc;

  await req.payload.create({
    collection: "workflow-events",
    context: { skipWorkflowEvent: true },
    data: {
      article: Number(doc.id),
      actor: isCMSUser(req.user) ? Number(req.user.id) : undefined,
      fromStatus: from,
      toStatus: to,
      occurredAt: new Date().toISOString(),
    },
    overrideAccess: true,
    req,
  });

  return doc;
};
