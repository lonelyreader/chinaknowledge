import { APIError, type PayloadRequest } from "payload";

import type { Person } from "@/payload-types";

import { assertMediaAllowedForMemberPublication } from "./media-policy";
import { isValidEmailProfileLink, isValidWebProfileLink } from "./profile-links";
import { hasEditorialRole, isCMSUser } from "./roles";

export type ProfilePublicationTarget = "draft" | "public";
export type ProfilePublicationAction = "publish" | "withdraw";

function relationID(value: unknown) {
  return value && typeof value === "object" && "id" in value
    ? (value as { id: unknown }).id
    : value;
}

function ownsProfile(person: Person, req: PayloadRequest) {
  return isCMSUser(req.user) && String(relationID(person.user)) === String(req.user.id);
}

export async function prepareProfilePublication(
  person: Person,
  targetStatus: ProfilePublicationTarget,
  req: PayloadRequest,
) {
  if (!isCMSUser(req.user)) throw new APIError("Authentication is required.", 401);
  if (!ownsProfile(person, req) && !hasEditorialRole(req.user)) {
    throw new APIError("Members can only change their own profile.", 403);
  }
  if (person.profileStatus === "paused") {
    throw new APIError("A paused profile cannot be changed by this action.", 403);
  }
  if (person.profileStatus === targetStatus) {
    throw new APIError("The profile is already in the requested state.", 409);
  }

  if (targetStatus === "draft") {
    const published = await req.payload.count({
      collection: "articles",
      overrideAccess: true,
      req,
      where: {
        and: [
          { author: { equals: person.id } },
          { publicationStatus: { equals: "published" } },
        ],
      },
    });
    if (published.totalDocs > 0) {
      throw new APIError("Withdraw your public articles before making this profile private.", 400);
    }
    return { action: "withdraw" as const, fromStatus: person.profileStatus, targetStatus };
  }

  const languages = person.languages ?? [];
  if (!person.name.trim() || !person.identity?.trim() || !person.introduction?.trim() || !person.city?.trim() || !languages.length) {
    throw new APIError("Name, identity, introduction, location, and languages are required before a profile can be public.", 400);
  }
  const portraitID = relationID(person.portrait);
  if (portraitID == null) throw new APIError("A portrait is required before a profile can be public.", 400);
  await assertMediaAllowedForMemberPublication(portraitID as number | string, req, "Portrait");

  for (const link of person.links ?? []) {
    const valid = link.type === "email"
      ? isValidEmailProfileLink(link.url)
      : isValidWebProfileLink(link.url);
    if (!valid) {
      throw new APIError(link.type === "email" ? "Email links must use a valid mailto address." : "Profile links must use a valid http or https URL.", 400);
    }
  }

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
        { author: { equals: person.id } },
        { publicationStatus: { equals: "published" } },
      ],
    },
  });
  if (published.docs.some((article) => !languages.includes(article.locale))) {
    throw new APIError("Keep every language used by your public articles on this profile.", 400);
  }
  return { action: "publish" as const, fromStatus: person.profileStatus, targetStatus };
}

export async function commitProfilePublication(
  person: Person,
  targetStatus: ProfilePublicationTarget,
  req: PayloadRequest,
) {
  await prepareProfilePublication(person, targetStatus, req);
  return req.payload.update({
    collection: "people",
    context: { profileTransitionConfirmed: true },
    data: { profileStatus: targetStatus },
    id: person.id,
    overrideAccess: false,
    req,
  });
}
