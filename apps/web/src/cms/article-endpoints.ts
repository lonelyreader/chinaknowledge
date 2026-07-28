import { APIError, type Endpoint, type Payload, type PayloadRequest } from "payload";

import type { Article } from "@/payload-types";
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

function relationIDs(values: unknown[] | null | undefined) {
  return values?.flatMap((value) => {
    const id = relationID(value);
    return typeof id === "number" ? [id] : [];
  });
}

function memberPromotableArticleData(article: Article) {
  return {
    body: article.body,
    coverImage: relationID(article.coverImage),
    summary: article.summary,
    title: article.title,
  };
}

function editorialPromotableArticleData(article: Article) {
  return {
    assignedEditor: relationID(article.assignedEditor),
    body: article.body,
    coverImage: relationID(article.coverImage),
    editorComments: article.editorComments,
    format: article.format,
    freshnessDate: article.freshnessDate,
    geographies: relationIDs(article.geographies),
    homepageEndsAt: article.homepageEndsAt,
    homepagePlacement: article.homepagePlacement,
    homepageStartsAt: article.homepageStartsAt,
    purposes: relationIDs(article.purposes),
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
        { autosave: { equals: true } },
      ],
    },
  });
  const article = versions.docs[0]?.version ?? fallback;
  return axis === "publication"
    ? memberPromotableArticleData(article)
    : editorialPromotableArticleData(article);
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
      if (!ownerAction && !isSuperAdmin(req.user)) {
        throw new APIError("Only the member or a Super Admin can change personal publication.", 403);
      }
      const unpublishing = current.publicationStatus === "published" && body.status !== "published";
      const promotedData =
        body.status === "published"
          ? await getLatestDraftData(req.payload, id, current, req)
          : undefined;
      const article = await req.payload.update({
        collection: "articles",
        id,
        context: {
          memberPublicationConfirmed: body.status === "published",
          publicationTransitionConfirmed: true,
        },
        data: {
          ...promotedData,
          publicationStatus: body.status,
          ...(unpublishing ? { _status: "draft" as const } : {}),
        },
        ...(unpublishing ? {} : { draft: body.status !== "published" }),
        overrideAccess: false,
        req,
      });
      return Response.json({
        id: article.id,
        publicationStatus: article.publicationStatus,
        curationStatus: article.curationStatus,
      });
    }

    if (!hasEditorialRole(req.user)) throw new APIError("Editor access is required.", 403);
    if (!isCurationStatus(body.status)) throw new APIError("Unknown curation status.", 400);
    const promotedData =
      body.status === "curated"
        ? await getLatestDraftData(req.payload, id, current, req, "curation")
        : undefined;
    const article = await req.payload.update({
      collection: "articles",
      id,
      context: { curationConfirmed: body.status === "curated" },
      data: {
        ...promotedData,
        curationStatus: body.status,
      },
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
