import { APIError, type Endpoint } from "payload";

import { isCMSUser } from "./roles";
import { isWorkflowStatus } from "./workflow";

type TransitionBody = {
  confirmed?: boolean;
  status?: unknown;
};

export const transitionArticleEndpoint: Endpoint = {
  path: "/:id/transition",
  method: "post",
  handler: async (req) => {
    if (!isCMSUser(req.user)) {
      throw new APIError("Authentication is required.", 401);
    }

    const id = req.routeParams?.id;
    if (typeof id !== "string" && typeof id !== "number") {
      throw new APIError("Article ID is required.", 400);
    }

    const body = (await req.json?.()) as TransitionBody | undefined;
    if (!isWorkflowStatus(body?.status)) {
      throw new APIError("Unknown editorial status.", 400);
    }

    if (body.status === "public" && body.confirmed !== true) {
      throw new APIError("Publication requires editorial confirmation.", 403);
    }

    const publishedArticle = await req.payload.findByID({
      collection: "articles",
      id,
      depth: 0,
      draft: false,
      overrideAccess: false,
      req,
    });
    const unpublishing = publishedArticle._status === "published" && body.status !== "public";

    const article = await req.payload.update({
      collection: "articles",
      id,
      context: { publicationConfirmed: body.status === "public" && body.confirmed === true },
      data: {
        workflowStatus: body.status,
        ...(unpublishing ? { _status: "draft" as const } : {}),
      },
      ...(unpublishing ? {} : { draft: body.status !== "public" }),
      overrideAccess: false,
      req,
    });

    return Response.json({ id: article.id, workflowStatus: article.workflowStatus });
  },
};
