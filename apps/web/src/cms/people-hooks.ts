import type { CollectionBeforeChangeHook } from "payload";
import { APIError } from "payload";

import { hasEditorialRole, isCMSUser } from "./roles";
import { assertMediaApprovedForPublicUse } from "./media-policy";

type PersonShape = {
  authorApprovalRecordedAt?: string | null;
  id: number | string;
  links?: { url?: string | null }[] | null;
  portrait?: number | string | { id: number | string } | null;
  profilePublishedAt?: string | null;
  profileStatus?: "draft" | "public" | "paused";
  spotlightExcluded?: boolean | null;
  spotlightPinnedUntil?: string | null;
  user?: number | string | { id: number | string };
};

export const enforcePersonPublication: CollectionBeforeChangeHook<PersonShape> = async ({
  data,
  operation,
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

  if (!hasEditorialRole(req.user) && operation === "update" && currentStatus !== "draft") {
    throw new APIError("Published profile changes require editorial review.", 403);
  }

  if (nextStatus !== "public") return data;

  const portrait = data.portrait ?? originalDoc?.portrait;
  const approval = data.authorApprovalRecordedAt ?? originalDoc?.authorApprovalRecordedAt;
  const links = data.links ?? originalDoc?.links ?? [];
  if (!portrait) throw new APIError("A portrait is required before a profile can be public.", 400);
  await assertMediaApprovedForPublicUse(portrait, req, "Portrait");
  if (!approval) {
    throw new APIError("Author approval must be recorded before a profile can be public.", 400);
  }
  for (const link of links) {
    try {
      const url = new URL(link.url ?? "");
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsafe protocol");
    } catch {
      throw new APIError("Profile links must use a valid http or https URL.", 400);
    }
  }

  const personID = originalDoc?.id;
  if (!personID) {
    throw new APIError("Save the profile as a draft before making it public.", 400);
  }
  const articles = await req.payload.find({
    collection: "articles",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { author: { equals: personID } },
        { workflowStatus: { equals: "public" } },
        { _status: { equals: "published" } },
      ],
    },
  });
  if (articles.docs.length === 0) {
    throw new APIError("A profile needs a public contribution before it can be public.", 400);
  }

  if (currentStatus !== "public") data.profilePublishedAt ||= new Date().toISOString();
  return data;
};
