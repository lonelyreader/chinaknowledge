import type { CollectionConfig, CollectionSlug } from "payload";

import { readOwnAgentRecordsOrSuperAdmin } from "@/cms/access";

export const AgentEvents: CollectionConfig = {
  slug: "agent-events",
  labels: { singular: "Agent activity", plural: "Recent activity" },
  admin: {
    defaultColumns: ["tool", "objectType", "result", "occurredAt"],
    group: "Account",
    hidden: true,
    hideAPIURL: true,
  },
  access: {
    create: () => false,
    delete: () => false,
    read: readOwnAgentRecordsOrSuperAdmin,
    update: () => false,
  },
  fields: [
    { name: "user", type: "relationship", relationTo: "users", required: true, index: true },
    {
      name: "connection",
      type: "relationship",
      relationTo: "agent-connections" as CollectionSlug,
      index: true,
    },
    { name: "clientFamily", type: "text", required: true, index: true },
    { name: "tool", type: "text", required: true, index: true },
    {
      name: "objectType",
      type: "select",
      options: [
        { label: "Account", value: "account" },
        { label: "Article", value: "article" },
        { label: "Connection", value: "connection" },
      ],
    },
    { name: "objectId", type: "text" },
    { name: "requestId", type: "text", required: true, index: true },
    {
      name: "idempotencyDigest",
      type: "text",
      unique: true,
      index: true,
      access: { read: () => false },
      admin: { hidden: true },
    },
    {
      name: "inputFingerprint",
      type: "text",
      access: { read: () => false },
      admin: { hidden: true },
    },
    {
      name: "result",
      type: "select",
      required: true,
      options: [
        { label: "Pending", value: "pending" },
        { label: "Success", value: "success" },
        { label: "Denied", value: "denied" },
        { label: "Conflict", value: "conflict" },
        { label: "Failed", value: "failed" },
      ],
    },
    { name: "beforeRevision", type: "text" },
    { name: "afterRevision", type: "text" },
    { name: "occurredAt", type: "date", required: true, index: true },
  ],
};
