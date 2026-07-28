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
    defaultColumns: ["article", "fromStatus", "toStatus", "actor", "occurredAt"],
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
  ],
};
