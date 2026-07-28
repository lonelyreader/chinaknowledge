import type { Access, FieldAccess, Where } from "payload";

import { hasEditorialRole, isCMSUser, isSuperAdmin } from "./roles";

export const authenticated: Access = ({ req }) => isCMSUser(req.user);

export const editorial: Access = ({ req }) =>
  isCMSUser(req.user) && hasEditorialRole(req.user);

export const superAdmin: Access = ({ req }) =>
  isCMSUser(req.user) && isSuperAdmin(req.user);

export const authenticatedField: FieldAccess = ({ req }) => isCMSUser(req.user);

function relationID(value: unknown) {
  if (typeof value === "number" || typeof value === "string") return value;
  if (value && typeof value === "object") {
    if ("id" in value) {
      const id = (value as { id?: unknown }).id;
      return typeof id === "number" || typeof id === "string" ? id : null;
    }
    if ("value" in value) return relationID((value as { value?: unknown }).value);
  }
  return null;
}

export const ownArticleFieldOrEditorial: FieldAccess = ({ doc, req }) => {
  if (!isCMSUser(req.user)) return false;
  if (hasEditorialRole(req.user)) return true;
  return String(relationID(doc?.owner)) === String(req.user.id);
};

export const ownPersonFieldOrEditorial: FieldAccess = ({ doc, req }) => {
  if (!isCMSUser(req.user)) return false;
  if (hasEditorialRole(req.user)) return true;
  return String(relationID(doc?.user)) === String(req.user.id);
};

export const editorialField: FieldAccess = ({ req }) =>
  isCMSUser(req.user) && hasEditorialRole(req.user);

export const authorField: FieldAccess = ({ req }) =>
  isCMSUser(req.user) && req.user.role === "author";

export const superAdminField: FieldAccess = ({ req }) =>
  isCMSUser(req.user) && isSuperAdmin(req.user);

export const readUsers: Access = ({ req }) => {
  if (!isCMSUser(req.user)) return false;
  if (isSuperAdmin(req.user)) return true;
  return { id: { equals: req.user.id } };
};

export const updateOwnUserOrSuperAdmin: Access = ({ req }) => {
  if (!isCMSUser(req.user)) return false;
  if (isSuperAdmin(req.user)) return true;
  return { id: { equals: req.user.id } };
};

export const readPublicArticlesOrOwned: Access = async ({ req }) => {
  if (isCMSUser(req.user) && hasEditorialRole(req.user)) return true;

  const publicPeople = await req.payload.find({
    collection: "people",
    depth: 0,
    limit: 200,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        { profileStatus: { equals: "public" } },
        { portrait: { exists: true } },
        { profilePublishedAt: { exists: true } },
      ],
    },
  });
  const completePublicPeople = publicPeople.docs.filter((person) =>
    Boolean(
      person.name?.trim()
      && person.identity?.trim()
      && person.introduction?.trim()
      && person.city?.trim()
      && person.portrait
      && person.languages?.length,
    ),
  );
  const publicAuthorsByLocale: Where[] = (["en", "es"] as const).map((locale): Where => ({
    and: [
      { locale: { equals: locale } },
      { author: { in: completePublicPeople
        .filter((person) => person.languages?.includes(locale))
        .map((person) => person.id) } },
    ],
  }));

  const publicQuery: Where = {
    and: [
      { publicationStatus: { equals: "published" } },
      { _status: { equals: "published" } },
      { publishedAt: { exists: true } },
      { or: publicAuthorsByLocale },
    ],
  };

  if (!isCMSUser(req.user)) return publicQuery;

  return {
    or: [{ owner: { equals: req.user.id } }, publicQuery],
  };
};

export const updateOwnedArticlesOrEditorial: Access = async ({ id, req }) => {
  if (!isCMSUser(req.user)) return false;
  if (hasEditorialRole(req.user)) return true;
  if (id === undefined || id === null) return false;

  const article = await req.payload.findByID({
    collection: "articles",
    id,
    depth: 0,
    draft: true,
    overrideAccess: true,
    req,
  });
  const owner = article.owner;
  const ownerID = owner && typeof owner === "object" ? owner.id : owner;
  return ownerID === req.user.id;
};

export const readOwnedArticleVersionsOrEditorial: Access = ({ req }) => {
  if (!isCMSUser(req.user)) return false;
  if (hasEditorialRole(req.user)) return true;
  return { "version.owner": { equals: req.user.id } };
};

export const readPublicPeopleOrOwn: Access = ({ req }) => {
  if (isCMSUser(req.user) && hasEditorialRole(req.user)) return true;
  const publicPeople: Where = {
    and: [
      { profileStatus: { equals: "public" } },
      { portrait: { exists: true } },
      { profilePublishedAt: { exists: true } },
    ],
  };
  if (!isCMSUser(req.user)) return publicPeople;
  const visiblePeople: Where = {
    or: [
      { user: { equals: req.user.id } },
      publicPeople,
    ],
  };
  return visiblePeople;
};

export const updateOwnPersonOrEditorial: Access = ({ req }) => {
  if (!isCMSUser(req.user)) return false;
  if (hasEditorialRole(req.user)) return true;
  return { user: { equals: req.user.id } };
};

export const readOwnPersonVersionsOrEditorial: Access = ({ req }) => {
  if (!isCMSUser(req.user)) return false;
  if (hasEditorialRole(req.user)) return true;
  return { "version.user": { equals: req.user.id } };
};

export const createOwnPersonRevision: Access = ({ req }) =>
  isCMSUser(req.user) && req.user.role === "author";

export const readOwnPersonRevisionsOrEditorial: Access = ({ req }) => {
  if (!isCMSUser(req.user)) return false;
  if (hasEditorialRole(req.user)) return true;
  return { proposer: { equals: req.user.id } };
};

export const updateOwnOpenPersonRevisionsOrEditorial: Access = ({ req }) => {
  if (!isCMSUser(req.user)) return false;
  if (hasEditorialRole(req.user)) return true;
  const openRevisionQuery: Where = {
    and: [
      { proposer: { equals: req.user.id } },
      { status: { in: ["draft", "changes_requested"] } },
    ],
  };
  return openRevisionQuery;
};

export const readApprovedMediaOrOwn: Access = ({ req }) => {
  const approved: Where = {
    or: [
      { publicUseApprovedAt: { exists: true } },
      { memberUsePublishedAt: { exists: true } },
    ],
  };
  if (!isCMSUser(req.user)) return approved;
  if (hasEditorialRole(req.user)) return true;
  return {
    or: [
      { uploadedBy: { equals: req.user.id } },
      approved,
    ],
  };
};

export const updateOwnMediaOrEditorial: Access = ({ req }) => {
  if (!isCMSUser(req.user)) return false;
  if (hasEditorialRole(req.user)) return true;
  return { uploadedBy: { equals: req.user.id } };
};

export const readPublicPlacesOrEditorial: Access = ({ req }) => {
  if (isCMSUser(req.user) && hasEditorialRole(req.user)) return true;
  const publicPlaces: Where = {
    and: [
      { status: { equals: "public" } },
      { coverImage: { exists: true } },
      { geography: { exists: true } },
      { publishedAt: { exists: true } },
    ],
  };
  return publicPlaces;
};
