import { randomUUID } from "node:crypto";
import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
} from "payload";
import { APIError } from "payload";

import { hasEditorialRole, isCMSUser, type Role } from "./roles";
import {
  assertWorkflowTransition,
  isWorkflowStatus,
  type WorkflowStatus,
} from "./workflow";

type ArticleShape = {
  id: number | string;
  locale?: "en" | "es";
  owner?: number | string | { id: number | string };
  slug?: string;
  translationGroup?: string;
  workflowStatus?: WorkflowStatus;
  _status?: "draft" | "published";
};

function relationID(value: ArticleShape["owner"]) {
  if (value && typeof value === "object") return value.id;
  return value;
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

export const enforceArticleWorkflow: CollectionBeforeChangeHook<ArticleShape> = ({
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
    data.workflowStatus = "draft";
    data._status = "draft";
    return data;
  }

  if (!originalDoc) return data;
  const current = originalDoc.workflowStatus ?? "draft";
  const next = data.workflowStatus ?? current;

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
  }

  assertWorkflowTransition(role, current, next, context.publicationConfirmed === true);

  if (next === "public") {
    if (!hasEditorialRole(req.user)) {
      throw new APIError("Authors cannot publish content.", 403);
    }
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
