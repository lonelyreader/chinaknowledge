import type { CollectionBeforeChangeHook, CollectionBeforeDeleteHook } from "payload";
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
  slug?: string | null;
  spotlightExcluded?: boolean | null;
  spotlightPinnedUntil?: string | null;
  user?: number | string | { id: number | string };
};

function relationID(value: PersonShape["user"]) {
  return value && typeof value === "object" ? value.id : value;
}

function sameRelation(left: PersonShape["user"], right: PersonShape["user"]) {
  const leftID = relationID(left);
  const rightID = relationID(right);
  return leftID !== undefined && rightID !== undefined && String(leftID) === String(rightID);
}

export const enforcePersonPublication: CollectionBeforeChangeHook<PersonShape> = async ({
  context,
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

  if (operation === "update" && originalDoc && data.user !== undefined && !sameRelation(data.user, originalDoc.user)) {
    throw new APIError("A profile owner cannot be changed.", 403);
  }
  if (originalDoc?.profilePublishedAt && data.slug !== undefined && data.slug !== originalDoc.slug) {
    throw new APIError("A published profile URL cannot be changed.", 403);
  }
  if (
    originalDoc
    && data.profilePublishedAt !== undefined
    && data.profilePublishedAt !== originalDoc.profilePublishedAt
  ) {
    throw new APIError("Profile publication time is managed by profile actions.", 403);
  }

  if (originalDoc && nextStatus !== currentStatus && context.profileTransitionConfirmed !== true) {
    throw new APIError("Use the profile action to change profile visibility.", 403);
  }
  if (originalDoc && currentStatus === "public" && nextStatus !== "public") {
    const published = await req.payload.count({
      collection: "articles",
      overrideAccess: true,
      req,
      where: {
        and: [
          { author: { equals: originalDoc.id } },
          { publicationStatus: { equals: "published" } },
        ],
      },
    });
    if (published.totalDocs > 0) {
      throw new APIError("Withdraw your public articles before making this profile private.", 400);
    }
  }

  if (!hasEditorialRole(req.user)) {
    data.profilePublishedAt = originalDoc?.profilePublishedAt ?? null;
  }

  if (!hasEditorialRole(req.user) && nextStatus === "paused") {
    throw new APIError("Only a site administrator can pause a profile.", 403);
  }

  if (nextStatus !== "public") return data;

  const name = data.name !== undefined ? data.name : originalDoc?.name;
  const identity = data.identity !== undefined ? data.identity : originalDoc?.identity;
  const introduction = data.introduction !== undefined ? data.introduction : originalDoc?.introduction;
  const city = data.city !== undefined ? data.city : originalDoc?.city;
  const languages = data.languages !== undefined ? data.languages ?? [] : originalDoc?.languages ?? [];
  const portrait = data.portrait !== undefined ? data.portrait : originalDoc?.portrait;
  const links = data.links !== undefined ? data.links ?? [] : originalDoc?.links ?? [];
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

  if (originalDoc?.id) {
    const published = await req.payload.find({
      collection: "articles",
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      req,
      select: { locale: true },
      where: {
        and: [
          { author: { equals: originalDoc.id } },
          { publicationStatus: { equals: "published" } },
        ],
      },
    });
    const missingLanguage = published.docs.find((article) => !languages.includes(article.locale));
    if (missingLanguage) {
      throw new APIError("Keep every language used by your public articles on this profile.", 400);
    }
  }

  if (currentStatus !== "public") data.profilePublishedAt ||= new Date().toISOString();
  return data;
};

export const protectPersonWithArticles: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const articles = await req.payload.count({
    collection: "articles",
    overrideAccess: true,
    req,
    where: { author: { equals: id } },
  });
  if (articles.totalDocs > 0) {
    throw new APIError("Remove this person's articles before deleting the profile.", 400);
  }
};
