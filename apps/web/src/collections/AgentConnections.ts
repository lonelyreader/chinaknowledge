import type { CollectionConfig, CollectionSlug } from "payload";

import { readOwnAgentRecordsOrSuperAdmin } from "@/cms/access";

const secretField = (name: string, indexed = false) => ({
  name,
  type: "text" as const,
  ...(indexed ? { index: true, unique: true } : {}),
  access: { read: () => false },
  admin: { hidden: true },
});

export const AgentConnections: CollectionConfig = {
  slug: "agent-connections",
  labels: { singular: "Agent connection", plural: "Agent access" },
  admin: {
    defaultColumns: ["client", "state", "lastUsedAt", "revokedAt"],
    group: "Account",
    hideAPIURL: true,
    components: { views: { list: { Component: "/cms/components/AgentAccess#AgentAccess" } } },
  },
  access: {
    create: () => false,
    delete: () => false,
    read: readOwnAgentRecordsOrSuperAdmin,
    update: () => false,
  },
  fields: [
    { name: "user", type: "relationship", relationTo: "users", required: true, index: true },
    { name: "person", type: "relationship", relationTo: "people", index: true },
    {
      name: "client",
      type: "relationship",
      relationTo: "agent-oauth-clients" as CollectionSlug,
      required: true,
      index: true,
    },
    {
      name: "scopes",
      type: "select",
      hasMany: true,
      required: true,
      options: [
        { label: "Member access", value: "agent:member" },
        { label: "Keep signed in", value: "offline_access" },
      ],
    },
    { name: "resource", type: "text", required: true },
    { name: "tokenFamily", type: "text", required: true, unique: true, index: true },
    {
      name: "state",
      type: "select",
      required: true,
      defaultValue: "active",
      index: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Revoked", value: "revoked" },
        { label: "Compromised", value: "compromised" },
      ],
    },
    secretField("authorizationCodeDigest", true),
    secretField("codeChallenge"),
    { name: "authorizationRedirectUri", type: "text" },
    { name: "codeExpiresAt", type: "date" },
    { name: "codeConsumedAt", type: "date" },
    secretField("accessTokenDigest", true),
    { name: "accessExpiresAt", type: "date" },
    secretField("refreshTokenDigest", true),
    { ...secretField("previousRefreshTokenDigest"), index: true },
    { name: "refreshExpiresAt", type: "date" },
    { name: "lastUsedAt", type: "date" },
    { name: "revokedAt", type: "date" },
  ],
};
