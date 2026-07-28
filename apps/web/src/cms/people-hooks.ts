import type { CollectionBeforeChangeHook } from "payload";
import { APIError } from "payload";

import { hasEditorialRole, isCMSUser } from "./roles";
import { markMediaForMemberPublication } from "./media-policy";

type PersonShape = {
  authorApprovalRecordedAt?: string | null;
  id: number | string;
  city?: string | null;
  identity?: string | null;
  introduction?: string | null;
  languages?: ("en" | "es")[] | null;
  name?: string | null;
  links?: { url?: string | null }[] | null;
  portrait?: number | string | { id: number | string } | null;
  profilePublishedAt?: string | null;
  profileStatus?: "draft" | "public" | "paused";
  spotlightExcluded?: boolean | null;
  spotlightPinnedUntil?: string | null;
  user?: number | string | { id: number | string };
};

export const enforcePersonPublication: CollectionBeforeChangeHook<PersonShape> = async ({
  context,
  data,
  originalDoc,
  req,
}) => {
  if (!data || !isCMSUser(req.user)) return data;

  const excluded = data.spotlightExcluded ?? originalDoc?.spotlightExcluded ?? false;
  const pinnedUntil = data.spotlightPinnedUntil ?? originalDoc?.spotlightPinnedUntil;
  if (excluded && pinnedUntil && new Date(pinnedUntil).getTime() > Date.now()) {
    throw new APIError("A profile cannot be excluded and pinned at the same time.", 400);
  }
  if (pinnedUntil && new Date(pinnedUntil).getTime() > Date.now()) {
    const pinned = await req.payload.find({
      collection: "people",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          { spotlightPinnedUntil: { greater_than: new Date().toISOString() } },
          ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
        ],
      },
    });
    if (pinned.docs.length) throw new APIError("Only one profile can be pinned at a time.", 400);
  }

  const currentStatus = originalDoc?.profileStatus ?? "draft";
  const nextStatus = data.profileStatus ?? currentStatus;

  if (originalDoc && nextStatus !== currentStatus && context.profileTransitionConfirmed !== true) {
    throw new APIError("Use the profile action to change profile visibility.", 403);
  }

  if (!hasEditorialRole(req.user)) {
    data.profilePublishedAt = originalDoc?.profilePublishedAt ?? null;
  }

  if (!hasEditorialRole(req.user) && nextStatus === "paused") {
    throw new APIError("Only a site administrator can pause a profile.", 403);
  }

  if (nextStatus !== "public") return data;

  const name = data.name ?? originalDoc?.name;
  const identity = data.identity ?? originalDoc?.identity;
  const introduction = data.introduction ?? originalDoc?.introduction;
  const city = data.city ?? originalDoc?.city;
  const languages = data.languages ?? originalDoc?.languages ?? [];
  const portrait = data.portrait ?? originalDoc?.portrait;
  const links = data.links ?? originalDoc?.links ?? [];
  if (!name?.trim() || !identity?.trim() || !introduction?.trim() || !city?.trim() || !languages.length) {
    throw new APIError("Name, identity, introduction, location, and languages are required before a profile can be public.", 400);
  }
  if (!portrait) throw new APIError("A portrait is required before a profile can be public.", 400);
  await markMediaForMemberPublication(portrait, req, "Portrait");
  for (const link of links) {
    try {
      const url = new URL(link.url ?? "");
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsafe protocol");
    } catch {
      throw new APIError("Profile links must use a valid http or https URL.", 400);
    }
  }

  if (currentStatus !== "public") data.profilePublishedAt ||= new Date().toISOString();
  return data;
};
