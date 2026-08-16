import { APIError, type Endpoint } from "payload";

import { commitEditorialSiteSelection } from "./article-curation";
import { commitMemberPublication } from "./article-publication";
import { createArticleTranslationDraft } from "./article-translation";
import { hasEditorialRole, isCMSUser, isSuperAdmin } from "./roles";
import { isCurationStatus, isPublicationStatus } from "./workflow";
import { createEditorialNotificationEvent } from "./editorial-notifications";

type TransitionBody = {
  axis?: "publication" | "curation";
  confirmed?: boolean;
  status?: unknown;
};

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

export const transitionArticleEndpoint: Endpoint = {
  path: "/:id/transition",
  method: "post",
  handler: async (req) => {
    if (!isCMSUser(req.user)) throw new APIError("Authentication is required.", 401);
    const id = req.routeParams?.id;
    if (typeof id !== "string" && typeof id !== "number") {
      throw new APIError("Article ID is required.", 400);
    }
    const body = (await req.json?.()) as TransitionBody | undefined;
    if (body?.axis !== "publication" && body?.axis !== "curation") {
      throw new APIError("A transition axis is required.", 400);
    }
    if (body.confirmed !== true) throw new APIError("Confirmation is required.", 403);

    const current = await req.payload.findByID({
      collection: "articles",
      id,
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
    });
    const ownerAction = relationID(current.owner) === req.user.id;

    if (body.axis === "publication") {
      if (!isPublicationStatus(body.status)) throw new APIError("Unknown publication status.", 400);
      if (body.status !== "published" && body.status !== "withdrawn") {
        throw new APIError("Choose publish or withdraw.", 400);
      }
      if (current.authorshipType === "site" && !isSuperAdmin(req.user)) {
        throw new APIError("Only a Super Admin can publish or withdraw site content.", 403);
      }
      if (!ownerAction && !isSuperAdmin(req.user)) {
        throw new APIError("Only the member or a Super Admin can change personal publication.", 403);
      }
      const article = await commitMemberPublication(current, body.status, req);
      return Response.json({
        id: article.id,
        publicationStatus: article.publicationStatus,
        curationStatus: article.curationStatus,
      });
    }

    if (!hasEditorialRole(req.user)) throw new APIError("Editor access is required.", 403);
    if (!isCurationStatus(body.status)) throw new APIError("Unknown curation status.", 400);
    const article = body.status === "curated" || body.status === "removed"
      ? await commitEditorialSiteSelection(current, body.status, req)
      : await req.payload.update({
          collection: "articles",
          id,
          data: { curationStatus: body.status },
          draft: false,
          overrideAccess: false,
          req,
        });
    return Response.json({
      id: article.id,
      publicationStatus: article.publicationStatus,
      curationStatus: article.curationStatus,
    });
  },
};

export const createArticleTranslationEndpoint: Endpoint = {
  path: "/:id/translation",
  method: "post",
  handler: async (req) => {
    if (!isCMSUser(req.user)) throw new APIError("Authentication is required.", 401);
    const id = req.routeParams?.id;
    if (typeof id !== "string" && typeof id !== "number") {
      throw new APIError("Article ID is required.", 400);
    }
    const result = await createArticleTranslationDraft(id, req);
    return Response.json(
      { id: result.article.id, url: `/admin/collections/articles/${result.article.id}` },
      { status: result.created ? 201 : 200 },
    );
  },
};

export const notifyArticleAuthorEndpoint: Endpoint = {
  path: "/:id/notify-author",
  method: "post",
  handler: async (req) => {
    if (!isCMSUser(req.user)) throw new APIError("Authentication is required.", 401);
    if (!hasEditorialRole(req.user)) throw new APIError("Editor access is required.", 403);
    const id = req.routeParams?.id;
    if (typeof id !== "string" && typeof id !== "number") {
      throw new APIError("Article ID is required.", 400);
    }
    const article = await req.payload.findByID({
      collection: "articles",
      id,
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
    });
    if (article.authorshipType === "site") {
      throw new APIError("Site content has no Member author to notify.", 400);
    }
    const status = article.curationStatus ?? "not_selected";
    const event = await createEditorialNotificationEvent({
      article,
      fromStatus: status,
      kind: "major_edit",
      req,
      toStatus: status,
    });
    return Response.json({ notificationStatus: event?.notificationStatus ?? "not_required" });
  },
};
