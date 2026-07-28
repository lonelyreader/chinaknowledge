import type { CollectionConfig } from "payload";

import { editorial } from "@/cms/access";
import { curationStatuses, publicationStatuses } from "@/cms/workflow";

const legacyStatuses = [
  "submitted",
  "in_review",
  "changes_requested",
  "approved",
  "public",
  "archived",
] as const;
const statusOptions = [...publicationStatuses, ...curationStatuses, ...legacyStatuses].map((value) => ({
  label: value.replaceAll("_", " "),
  value,
}));

export const WorkflowEvents: CollectionConfig = {
  slug: "workflow-events",
  labels: { singular: "Workflow event", plural: "Workflow events" },
  admin: {
    defaultColumns: ["article", "fromStatus", "toStatus", "actor", "notificationStatus", "occurredAt"],
    group: "Editorial",
    hideAPIURL: true,
  },
  access: {
    create: () => false,
    delete: () => false,
    read: editorial,
    update: () => false,
  },
  fields: [
    { name: "article", type: "relationship", relationTo: "articles", required: true },
    { name: "actor", type: "relationship", relationTo: "users" },
    {
      name: "axis",
      type: "select",
      options: [
        { label: "Publication", value: "publication" },
        { label: "Curation", value: "curation" },
      ],
    },
    { name: "fromStatus", type: "select", options: statusOptions },
    { name: "toStatus", type: "select", required: true, options: statusOptions },
    { name: "occurredAt", type: "date", required: true },
    {
      name: "notificationKind",
      type: "select",
      options: [
        { label: "Selected", value: "selected" },
        { label: "Major edit", value: "major_edit" },
        { label: "Needs recheck", value: "needs_recheck" },
        { label: "Removed", value: "removed" },
      ],
    },
    {
      name: "notificationStatus",
      type: "select",
      defaultValue: "not_required",
      options: [
        { label: "Not required", value: "not_required" },
        { label: "Pending", value: "pending" },
        { label: "Sent", value: "sent" },
        { label: "Failed", value: "failed" },
      ],
    },
    { name: "notificationKey", type: "text", unique: true, index: true },
    { name: "notificationRecipient", type: "email" },
    { name: "notificationAttempts", type: "number", defaultValue: 0, min: 0 },
    { name: "notificationLastError", type: "textarea" },
    { name: "notificationSentAt", type: "date" },
  ],
};
