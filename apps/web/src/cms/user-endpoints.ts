import { randomBytes } from "node:crypto";
import { APIError, type Endpoint } from "payload";

import { isCMSUser, isSuperAdmin } from "./roles";

type InviteBody = {
  displayName?: unknown;
  email?: unknown;
  role?: unknown;
};

function requireSuperAdmin(user: unknown) {
  if (!isCMSUser(user)) throw new APIError("Authentication is required.", 401);
  if (!isSuperAdmin(user)) throw new APIError("Super Admin access is required.", 403);
}

function normalizeEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new APIError("A valid email is required.", 400);
  }
  return email;
}

export const inviteUserEndpoint: Endpoint = {
  path: "/invite",
  method: "post",
  handler: async (req) => {
    requireSuperAdmin(req.user);
    const body = (await req.json?.()) as InviteBody | undefined;
    const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
    const email = normalizeEmail(body?.email);
    const role = body?.role;
    if (!displayName) throw new APIError("A name is required.", 400);
    if (role !== "author" && role !== "editor") {
      throw new APIError("Role must be Member or Editor.", 400);
    }

    const existing = await req.payload.find({
      collection: "users",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: { email: { equals: email } },
    });
    if (existing.docs.length) throw new APIError("This email already has an account.", 409);

    const password = `${randomBytes(32).toString("base64url")}Aa1!`;
    const user = await req.payload.create({
      collection: "users",
      data: { accountStatus: "active", displayName, email, password, role },
      overrideAccess: false,
      req,
    });

    try {
      await req.payload.forgotPassword({
        collection: "users",
        data: { email },
        overrideAccess: true,
      });
    } catch {
      throw new APIError("The account was created, but the invitation email failed. Resend the invitation.", 502);
    }

    return Response.json({ email: user.email, id: user.id, invited: true }, { status: 201 });
  },
};

export const resendUserInviteEndpoint: Endpoint = {
  path: "/invite/resend",
  method: "post",
  handler: async (req) => {
    requireSuperAdmin(req.user);
    const body = (await req.json?.()) as InviteBody | undefined;
    const email = normalizeEmail(body?.email);
    const existing = await req.payload.find({
      collection: "users",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: { email: { equals: email } },
    });
    if (!existing.docs.length) throw new APIError("No account uses this email.", 404);
    await req.payload.forgotPassword({
      collection: "users",
      data: { email },
      overrideAccess: true,
    });
    return Response.json({ email, invited: true });
  },
};
