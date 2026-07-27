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
      { workflowStatus: { equals: "public" } },
      { _status: { equals: "published" } },
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
  return (
    ownerID === req.user.id &&
    (article.workflowStatus === "draft" || article.workflowStatus === "changes_requested")
  );
};

export const readOwnedArticleVersionsOrEditorial: Access = async ({ id, req }) => {
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

export const readPublicPeopleOrOwn: Access = ({ req }) => {
  if (isCMSUser(req.user) && hasEditorialRole(req.user)) return true;
  const publicPeople: Where = { profileStatus: { equals: "public" } };
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
