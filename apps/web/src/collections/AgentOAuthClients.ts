import type { CollectionConfig } from "payload";

import { superAdmin } from "@/cms/access";

export const AgentOAuthClients: CollectionConfig = {
  slug: "agent-oauth-clients",
  labels: { singular: "Agent client", plural: "Agent clients" },
  admin: {
    defaultColumns: ["clientName", "clientFamily", "lastUsedAt", "disabled"],
    group: "System",
    hidden: ({ user }) => user?.role !== "super_admin",
    hideAPIURL: true,
    useAsTitle: "clientName",
  },
  access: {
    create: () => false,
    delete: () => false,
    read: superAdmin,
    update: () => false,
  },
  fields: [
    { name: "clientId", type: "text", required: true, unique: true, index: true },
    { name: "clientName", type: "text", required: true },
    { name: "clientFamily", type: "text", required: true, index: true },
    {
      name: "redirectUris",
      type: "array",
      required: true,
      minRows: 1,
      maxRows: 8,
      fields: [{ name: "uri", type: "text", required: true }],
    },
    {
      name: "grantTypes",
      type: "select",
      hasMany: true,
      required: true,
      options: [
        { label: "Authorization code", value: "authorization_code" },
        { label: "Refresh token", value: "refresh_token" },
      ],
    },
    {
      name: "tokenEndpointAuthMethod",
      type: "select",
      required: true,
      defaultValue: "none",
      options: [{ label: "Public client", value: "none" }],
    },
    { name: "disabled", type: "checkbox", required: true, defaultValue: false, index: true },
    { name: "expiresAt", type: "date", index: true },
    { name: "lastUsedAt", type: "date" },
  ],
};
