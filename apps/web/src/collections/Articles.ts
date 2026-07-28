import type { CollectionConfig } from "payload";

import {
  authenticated,
  authenticatedField,
  editorial,
  editorialField,
  readOwnedArticleVersionsOrEditorial,
  readPublicArticlesOrOwned,
  updateOwnedArticlesOrEditorial,
} from "@/cms/access";
import {
  enforceArticleWorkflow,
  prepareArticle,
  recordWorkflowEvent,
} from "@/cms/article-hooks";
import { transitionArticleEndpoint } from "@/cms/article-endpoints";

const categoryField = (name: string, label: string, dimension: string) => ({
  name,
  label,
  type: "relationship" as const,
  relationTo: "taxonomies" as const,
  hasMany: true,
  filterOptions: { dimension: { equals: dimension } },
});

export const Articles: CollectionConfig = {
  slug: "articles",
  labels: { singular: "Article", plural: "Articles" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "locale", "format", "workflowStatus", "updatedAt"],
    group: "Editorial",
    hideAPIURL: true,
    components: {
      edit: {
        PublishButton: "/cms/components/NoPublishButton#NoPublishButton",
        Status: "/cms/components/NoPublishButton#NoPublishButton",
        UnpublishButton: "/cms/components/NoPublishButton#NoPublishButton",
      },
    },
  },
  endpoints: [transitionArticleEndpoint],
  access: {
    create: authenticated,
    delete: editorial,
    read: readPublicArticlesOrOwned,
    readVersions: readOwnedArticleVersionsOrEditorial,
    update: updateOwnedArticlesOrEditorial,
  },
  hooks: {
    beforeValidate: [prepareArticle],
    beforeChange: [enforceArticleWorkflow],
    afterChange: [recordWorkflowEvent],
  },
  versions: {
    drafts: { autosave: false, schedulePublish: false, validate: true },
    maxPerDoc: 50,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "summary", type: "textarea", required: true },
    { name: "body", type: "richText", required: true },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      label: "Cover image",
    },
    {
      name: "format",
      type: "select",
      required: true,
      options: [
        { label: "Guide", value: "guide" },
        { label: "Reporting", value: "reporting" },
        { label: "Analysis", value: "analysis" },
        { label: "First person", value: "first_person" },
        { label: "Update", value: "update" },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "locale",
          type: "select",
          required: true,
          index: true,
          options: [
            { label: "English", value: "en" },
            { label: "Spanish", value: "es" },
          ],
        },
        { name: "slug", type: "text", required: true, index: true },
      ],
    },
    {
      name: "translationGroup",
      type: "text",
      required: true,
      index: true,
      admin: { position: "sidebar", readOnly: true },
    },
    { name: "author", type: "relationship", relationTo: "people", required: true },
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      required: true,
      access: { read: authenticatedField, update: editorialField },
      admin: { position: "sidebar", readOnly: true },
    },
    categoryField("purposes", "Purposes", "purpose"),
    categoryField("topics", "Topics", "topic"),
    categoryField("geographies", "Geography", "geography"),
    categoryField("situations", "Situation", "situation"),
    {
      name: "sourceNotes",
      type: "array",
      label: "Sources",
      minRows: 1,
      required: true,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "url", type: "text" },
        {
          name: "check",
          type: "textarea",
          required: true,
          label: "Check",
          access: { read: authenticatedField },
        },
      ],
    },
    {
      name: "editorComments",
      type: "array",
      label: "Comments",
      access: {
        create: editorialField,
        read: authenticatedField,
        update: editorialField,
      },
      fields: [
        { name: "anchor", type: "text", required: true },
        { name: "message", type: "textarea", required: true },
        { name: "resolved", type: "checkbox", defaultValue: false },
        { name: "createdBy", type: "relationship", relationTo: "users", required: true },
      ],
    },
    {
      name: "workflowStatus",
      type: "select",
      required: true,
      defaultValue: "draft",
      access: { read: authenticatedField },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Submitted", value: "submitted" },
        { label: "In review", value: "in_review" },
        { label: "Changes requested", value: "changes_requested" },
        { label: "Approved", value: "approved" },
        { label: "Public", value: "public" },
        { label: "Archived", value: "archived" },
      ],
      admin: { hidden: true },
    },
    {
      name: "assignedEditor",
      type: "relationship",
      relationTo: "users",
      access: {
        create: editorialField,
        read: authenticatedField,
        update: editorialField,
      },
      filterOptions: { role: { in: ["editor", "super_admin"] } },
      admin: { position: "sidebar" },
    },
    {
      name: "freshnessDate",
      type: "date",
      label: "Freshness date",
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
    {
      name: "publishedAt",
      type: "date",
      label: "Published",
      access: { create: editorialField, update: editorialField },
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "homepagePlacement",
      type: "select",
      label: "Homepage",
      defaultValue: "none",
      access: { create: editorialField, update: editorialField },
      options: [
        { label: "None", value: "none" },
        { label: "Lead", value: "lead" },
        { label: "Selected", value: "selected" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "homepageStartsAt",
      type: "date",
      label: "Homepage starts",
      access: { create: editorialField, update: editorialField },
      admin: { position: "sidebar" },
    },
    {
      name: "homepageEndsAt",
      type: "date",
      label: "Homepage ends",
      access: { create: editorialField, update: editorialField },
      admin: { position: "sidebar" },
    },
    {
      name: "workflowActions",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: "/cms/components/WorkflowActions#WorkflowActions",
        },
      },
    },
  ],
};
