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
import { hasEditorialRole, isCMSUser } from "@/cms/roles";

const editorialCondition = (_data: unknown, _siblingData: unknown, { user }: { user: unknown }) =>
  isCMSUser(user) && hasEditorialRole(user);

const categoryField = (name: string, label: string, dimension: string) => ({
  name,
  label,
  type: "relationship" as const,
  relationTo: "taxonomies" as const,
  hasMany: true,
  access: { create: editorialField, update: editorialField },
  filterOptions: { dimension: { equals: dimension } },
  admin: { condition: editorialCondition },
});

export const Articles: CollectionConfig = {
  slug: "articles",
  labels: { singular: "Article", plural: "Articles" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "author", "locale", "publishedAt", "curationStatus", "updatedAt"],
    group: "Editorial",
    hideAPIURL: true,
    preview: (doc) => {
      const locale = doc.locale === "es" ? "es" : "en";
      return doc.id && doc.slug
        ? `/${locale}/posts/${doc.slug}?preview=${encodeURIComponent(String(doc.id))}`
        : null;
    },
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
    drafts: { autosave: { interval: 1200 }, schedulePublish: false, validate: false },
    maxPerDoc: 50,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "summary", type: "textarea" },
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
      access: { create: editorialField, update: editorialField },
      admin: { condition: editorialCondition },
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
        { name: "slug", type: "text", required: true, index: true, admin: { hidden: true } },
      ],
    },
    {
      name: "translationGroup",
      type: "text",
      required: true,
      index: true,
      admin: { hidden: true },
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "people",
      required: true,
      access: { create: editorialField, update: () => false },
      admin: { readOnly: true },
    },
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      required: true,
      access: { read: authenticatedField, update: editorialField },
      admin: { hidden: true },
    },
    categoryField("purposes", "Purposes", "purpose"),
    categoryField("topics", "Topics", "topic"),
    categoryField("geographies", "Geography", "geography"),
    categoryField("situations", "Situation", "situation"),
    {
      name: "sourceNotes",
      type: "array",
      label: "Sources",
      access: { create: editorialField, update: editorialField },
      admin: { condition: editorialCondition },
      fields: [
        { name: "label", type: "text", required: true },
        { name: "url", type: "text" },
        {
          name: "check",
          type: "textarea",
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
      admin: { condition: editorialCondition },
      fields: [
        { name: "anchor", type: "text", required: true },
        { name: "message", type: "textarea", required: true },
        { name: "resolved", type: "checkbox", defaultValue: false },
        { name: "createdBy", type: "relationship", relationTo: "users", required: true },
      ],
    },
    {
      name: "publicationStatus",
      type: "select",
      required: true,
      defaultValue: "draft",
      access: { read: authenticatedField },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Public", value: "published" },
        { label: "Withdrawn", value: "withdrawn" },
      ],
      admin: { hidden: true },
    },
    {
      name: "curationStatus",
      type: "select",
      required: true,
      defaultValue: "not_selected",
      access: { create: editorialField, read: () => true, update: editorialField },
      options: [
        { label: "Not selected", value: "not_selected" },
        { label: "Selected", value: "selected" },
        { label: "Editing", value: "editing" },
        { label: "Site selected", value: "curated" },
        { label: "Needs recheck", value: "needs_recheck" },
        { label: "Removed", value: "removed" },
      ],
      admin: { hidden: true },
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
      admin: { condition: editorialCondition, position: "sidebar" },
    },
    {
      name: "freshnessDate",
      type: "date",
      label: "Freshness date",
      access: { create: editorialField, update: editorialField },
      admin: { condition: editorialCondition, position: "sidebar", date: { pickerAppearance: "dayOnly" } },
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
      admin: { condition: editorialCondition, position: "sidebar" },
    },
    {
      name: "homepageStartsAt",
      type: "date",
      label: "Homepage starts",
      access: { create: editorialField, update: editorialField },
      admin: { condition: editorialCondition, position: "sidebar" },
    },
    {
      name: "homepageEndsAt",
      type: "date",
      label: "Homepage ends",
      access: { create: editorialField, update: editorialField },
      admin: { condition: editorialCondition, position: "sidebar" },
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
