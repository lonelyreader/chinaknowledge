import { APIError, type Endpoint } from "payload";

import { hasEditorialRole, isCMSUser } from "./roles";

type ProfileTransitionBody = {
  confirmed?: boolean;
  status?: unknown;
};

function relationID(value: unknown) {
  return value && typeof value === "object" && "id" in value
    ? (value as { id: unknown }).id
    : value;
}

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
    if (relationID(profile.user) !== req.user.id && !hasEditorialRole(req.user)) {
      throw new APIError("Members can only change their own profile.", 403);
    }
    const updated = await req.payload.update({
      collection: "people",
      context: { profileTransitionConfirmed: true },
      data: { profileStatus: body.status },
      id,
      overrideAccess: false,
      req,
    });
    return Response.json({ id: updated.id, profileStatus: updated.profileStatus });
  },
};
