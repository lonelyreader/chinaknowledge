import type { CollectionConfig } from "payload";

import { editorial, superAdmin } from "@/cms/access";
import { enforceEditorialMaster, prepareEditorialMaster } from "@/cms/editorial-master-hooks";

export const EditorialMasters: CollectionConfig = {
  slug: "editorial-masters",
  labels: { singular: "Chinese master", plural: "Chinese masters" },
  lockDocuments: { duration: 300 },
  admin: {
    useAsTitle: "titleZh",
    defaultColumns: ["titleZh", "purpose", "risk", "editorialStatus", "updatedAt"],
    group: "Editorial",
    hideAPIURL: true,
  },
  access: {
    create: editorial,
    delete: superAdmin,
    read: editorial,
    readVersions: editorial,
    update: editorial,
  },
  hooks: {
    beforeValidate: [prepareEditorialMaster],
    beforeChange: [enforceEditorialMaster],
  },
  versions: {
    drafts: { autosave: { interval: 1200 }, schedulePublish: false, validate: false },
    maxPerDoc: 50,
  },
  fields: [
    { name: "titleZh", type: "text", label: "中文标题", required: true },
    { name: "summaryZh", type: "textarea", label: "中文摘要", required: true },
    { name: "bodyZh", type: "richText", label: "中文正文", required: true },
    {
      type: "row",
      fields: [
        { name: "contentKey", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
        { name: "batchId", type: "text", required: true, index: true, admin: { readOnly: true } },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "purpose",
          type: "relationship",
          relationTo: "taxonomies",
          required: true,
          filterOptions: { dimension: { equals: "purpose" } },
        },
        {
          name: "risk",
          type: "select",
          required: true,
          defaultValue: "evergreen",
          options: [
            { label: "Evergreen", value: "evergreen" },
            { label: "Annual", value: "annual" },
            { label: "Volatile", value: "volatile" },
            { label: "High risk", value: "high" },
          ],
        },
      ],
    },
    {
      name: "topics",
      type: "relationship",
      relationTo: "taxonomies",
      hasMany: true,
      filterOptions: { dimension: { equals: "topic" } },
    },
    {
      name: "sourceNotes",
      type: "array",
      label: "来源与权利",
      required: true,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "url", type: "text", required: true },
        { name: "capturedAt", type: "date", label: "采集时间" },
        { name: "checkedAt", type: "date", label: "核验时间" },
        {
          name: "rights",
          type: "select",
          required: true,
          options: [
            { label: "Official fact reference", value: "official" },
            { label: "Permission or owned", value: "permission" },
            { label: "Factual reference only", value: "factual_reference" },
            { label: "Human expression reference only", value: "human_reference" },
            { label: "Restricted", value: "restricted" },
          ],
        },
        { name: "check", type: "textarea", label: "核验记录" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "rightsStatus",
          type: "select",
          required: true,
          defaultValue: "pending",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Cleared", value: "cleared" },
            { label: "Restricted", value: "restricted" },
          ],
        },
        {
          name: "editorialStatus",
          type: "select",
          required: true,
          defaultValue: "candidate",
          options: [
            { label: "Candidate", value: "candidate" },
            { label: "In review", value: "in_review" },
            { label: "Approved", value: "approved" },
            { label: "Translated", value: "translated" },
            { label: "Released", value: "released" },
          ],
        },
      ],
    },
    { name: "translationNotes", type: "textarea", label: "翻译记录" },
    {
      name: "assignedEditor",
      type: "relationship",
      relationTo: "users",
      filterOptions: { role: { in: ["editor", "super_admin"] } },
    },
    { name: "reviewedAt", type: "date", admin: { readOnly: true } },
    { name: "reviewedBy", type: "relationship", relationTo: "users", admin: { readOnly: true } },
    { name: "createdBy", type: "relationship", relationTo: "users", required: true, admin: { hidden: true } },
    { name: "contentHash", type: "text", required: true, index: true, admin: { readOnly: true } },
  ],
};
