import type { Access, FieldAccess, Where } from "payload";

import { hasEditorialRole, isCMSUser, isSuperAdmin } from "./roles";

export const authenticated: Access = ({ req }) => isCMSUser(req.user);

export const editorial: Access = ({ req }) =>
  isCMSUser(req.user) && hasEditorialRole(req.user);

export const superAdmin: Access = ({ req }) =>
  isCMSUser(req.user) && isSuperAdmin(req.user);

export const authenticatedField: FieldAccess = ({ req }) => isCMSUser(req.user);

export const editorialField: FieldAccess = ({ req }) =>
  isCMSUser(req.user) && hasEditorialRole(req.user);

export const authorField: FieldAccess = ({ req }) =>
  isCMSUser(req.user) && req.user.role === "author";

export const superAdminField: FieldAccess = ({ req }) =>
  isCMSUser(req.user) && isSuperAdmin(req.user);

export const readUsers: Access = ({ req }) => {
  if (!isCMSUser(req.user)) return false;
  if (hasEditorialRole(req.user)) return true;
  return { id: { equals: req.user.id } };
};

export const updateOwnUserOrSuperAdmin: Access = ({ req }) => {
  if (!isCMSUser(req.user)) return false;
  if (isSuperAdmin(req.user)) return true;
  return { id: { equals: req.user.id } };
};

export const readPublicArticlesOrOwned: Access = ({ req }) => {
  if (isCMSUser(req.user) && hasEditorialRole(req.user)) return true;

  const publicQuery: Where = {
    and: [
      { publicationStatus: { equals: "published" } },
      { _status: { equals: "published" } },
      { publishedAt: { exists: true } },
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
