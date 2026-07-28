import { APIError, type CollectionAfterChangeHook, type CollectionBeforeLoginHook } from "payload";

import type { User } from "@/payload-types";

function profileSlug(user: User) {
  const source = user.displayName || user.email.split("@")[0] || `member-${user.id}`;
  return source
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56) || `member-${user.id}`;
}

export const ensureMemberProfile: CollectionAfterChangeHook<User> = async ({ context, doc, operation, req }) => {
  if (operation !== "create" || context.skipMemberProfile === true) return doc;
  const linked = await req.payload.find({
    collection: "people",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: { user: { equals: doc.id } },
  });
  if (linked.docs.length) return doc;

  const baseSlug = profileSlug(doc);
  const collision = await req.payload.find({
    collection: "people",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: { slug: { equals: baseSlug } },
  });
  await req.payload.create({
    collection: "people",
    context: { skipMemberProfile: true },
    data: {
      name: doc.displayName,
      profileStatus: "draft",
      slug: collision.docs.length ? `${baseSlug}-${doc.id}` : baseSlug,
      user: doc.id,
    },
    overrideAccess: true,
    req,
  });
  return doc;
};

export const requireActiveAccount: CollectionBeforeLoginHook<User> = ({ user }) => {
  if (user.accountStatus === "paused") throw new APIError("This account is paused.", 403);
};
