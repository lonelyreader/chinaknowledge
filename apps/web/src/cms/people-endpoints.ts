import { APIError, type Endpoint } from "payload";

import { commitProfilePublication } from "./profile-publication";
import { isCMSUser } from "./roles";

type ProfileTransitionBody = {
  confirmed?: boolean;
  status?: unknown;
};

export const transitionProfileEndpoint: Endpoint = {
  path: "/:id/profile-transition",
  method: "post",
  handler: async (req) => {
    if (!isCMSUser(req.user)) throw new APIError("Authentication is required.", 401);
    const id = req.routeParams?.id;
    if (typeof id !== "string" && typeof id !== "number") {
      throw new APIError("Profile ID is required.", 400);
    }
    const body = (await req.json?.()) as ProfileTransitionBody | undefined;
    if (body?.confirmed !== true) throw new APIError("Confirmation is required.", 403);
    if (body.status !== "draft" && body.status !== "public") {
      throw new APIError("Unknown profile status.", 400);
    }
    const profile = await req.payload.findByID({
      collection: "people",
      depth: 0,
      id,
      overrideAccess: true,
      req,
    });
    const updated = await commitProfilePublication(profile, body.status, req);
    return Response.json({ id: updated.id, profileStatus: updated.profileStatus });
  },
};
