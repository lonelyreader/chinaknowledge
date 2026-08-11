import type { CollectionBeforeValidateHook, CollectionConfig } from "payload";
import { APIError } from "payload";

import {
  authenticated,
  editorial,
  editorialField,
  ownArticleFieldOrEditorial,
  readOwnedArticleVersionsOrEditorial,
  readPublicArticlesOrOwned,
  updateOwnedArticlesOrEditorial,
} from "@/cms/access";
import {
  enforceArticleWorkflow,
  prepareArticle,
  recordWorkflowEvent,
} from "@/cms/article-hooks";
import { createArticleTranslationEndpoint, notifyArticleAuthorEndpoint, transitionArticleEndpoint } from "@/cms/article-endpoints";
import { assertMediaAllowedForMemberPublication } from "@/cms/media-policy";
import { collectRichTextUploadMediaIDs } from "@/cms/rich-text-media";
import { hasEditorialRole, isCMSUser } from "@/cms/roles";

/*
 * INFRA-BODY-MEDIA-001: server-side whitelist for rich-text embeds.
 * Shared by the lexical youtubeEmbed block validate (payload.config.ts),
 * the beforeValidate guards below and in EditorialMasters. The public
 * renderer (CMSRichText.tsx) keeps its own copy on purpose so the read
 * path never trusts stored data.
 */
const YOUTUBE_EMBED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function extractYouTubeVideoID(rawURL: unknown): string | null {
  if (typeof rawURL !== "string") return null;
  let url: URL;
  try {
    url = new URL(rawURL.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return YOUTUBE_VIDEO_ID.test(id) ? id : null;
  }
  if (!YOUTUBE_EMBED_HOSTS.has(host)) return null;
  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v") ?? "";
    return YOUTUBE_VIDEO_ID.test(id) ? id : null;
  }
  const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})$/);
  return match ? match[1] : null;
}

type RichTextEmbedNode = {
  children?: RichTextEmbedNode[];
  fields?: Record<string, unknown>;
  type?: string;
};

export function assertAllowedRichTextEmbeds(value: unknown, fieldLabel: string) {
  const root = (value as { root?: RichTextEmbedNode } | null | undefined)?.root;
  if (!root || typeof root !== "object") return;
  const stack: RichTextEmbedNode[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    // INFRA-BODY-MEDIA-002 (F4): no inline blocks are configured in the
    // editor and the public renderer never renders them, so reject them
    // at write time instead of storing unrenderable content.
    if (node.type === "inlineBlock") {
      throw new APIError(`Inline embeds are not allowed in ${fieldLabel}.`, 400);
    }
    if (node.type === "block") {
      const blockType = node.fields?.blockType;
      if (blockType !== "youtubeEmbed") {
        throw new APIError(
          `Embed type "${String(blockType)}" is not allowed in ${fieldLabel}.`,
          400,
        );
      }
      if (!extractYouTubeVideoID(node.fields?.url)) {
        throw new APIError(
          `Only YouTube video links (youtube.com / youtu.be) are allowed in ${fieldLabel}.`,
          400,
        );
      }
    }
    if (Array.isArray(node.children)) stack.push(...node.children);
  }
}

const validateBodyEmbeds: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (data && data.body !== undefined) {
    assertAllowedRichTextEmbeds(data.body, "body");
    // INFRA-BODY-MEDIA-002 (F1): body images must belong to the writing
    // member or be approved for public use; editorial roles pass through.
    for (const mediaID of collectRichTextUploadMediaIDs(data.body)) {
      await assertMediaAllowedForMemberPublication(mediaID, req, "Body image");
    }
  }
  return data;
};

const editorialCondition = (_data: unknown, _siblingData: unknown, { user }: { user: unknown }) =>
  isCMSUser(user) && hasEditorialRole(user);

function relationID(value: unknown) {
  if (value && typeof value === "object") {
    if ("value" in value) return relationID((value as { value: unknown }).value);
    if ("id" in value) return (value as { id: unknown }).id;
  }
  return value;
}

const writingCondition = (data: unknown, _siblingData: unknown, { user }: { user: unknown }) => {
  if (!isCMSUser(user)) return false;
  if (!hasEditorialRole(user)) return true;
  const owner = relationID((data as { owner?: unknown } | null)?.owner);
  return owner == null || String(owner) === String(user.id);
};

const memberAuthorshipCondition = (data: unknown) =>
  (data as { authorshipType?: unknown } | null)?.authorshipType !== "site";

const siteAuthorshipCondition = (data: unknown) =>
  (data as { authorshipType?: unknown } | null)?.authorshipType === "site";

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
  indexes: [{ fields: ["translationGroup", "locale"], unique: true }],
  labels: { singular: "Article", plural: "Articles" },
  lockDocuments: { duration: 300 },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "authorshipType", "author", "locale", "publishedAt", "curationStatus", "updatedAt"],
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
        UnpublishButton: "/cms/components/NoPublishButton#NoPublishButton",
      },
    },
  },
  endpoints: [transitionArticleEndpoint, createArticleTranslationEndpoint, notifyArticleAuthorEndpoint],
  access: {
    create: authenticated,
    delete: editorial,
    read: readPublicArticlesOrOwned,
    readVersions: readOwnedArticleVersionsOrEditorial,
    update: updateOwnedArticlesOrEditorial,
  },
  hooks: {
    beforeValidate: [validateBodyEmbeds, prepareArticle],
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
      admin: { components: { Field: "/cms/components/AccessibleUploadField#AccessibleUploadField" } },
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
      type: "tabs",
      tabs: [
        {
          label: "Writing",
          admin: { condition: writingCondition },
          fields: [
            {
              name: "publicationActions",
              type: "ui",
              admin: { components: { Field: "/cms/components/WorkflowActions#PublicationActions" } },
            },
            {
              name: "translationActions",
              type: "ui",
              admin: { components: { Field: "/cms/components/TranslationActions#TranslationActions" } },
            },
          ],
        },
        {
          label: "Site",
          admin: { condition: editorialCondition },
          fields: [
            {
              name: "authorshipType",
              type: "select",
              label: "Public byline",
              required: true,
              defaultValue: "member",
              index: true,
              access: { create: editorialField, update: () => false },
              options: [
                { label: "Member", value: "member" },
                { label: "China, in Fact", value: "site" },
              ],
            },
            {
              name: "author",
              type: "relationship",
              relationTo: "people",
              access: { create: editorialField, update: () => false },
              admin: { condition: memberAuthorshipCondition, readOnly: true },
            },
            {
              name: "editorialMaster",
              type: "relationship",
              relationTo: "editorial-masters",
              access: { create: editorialField, read: editorialField, update: () => false },
              admin: { condition: siteAuthorshipCondition },
              filterOptions: { editorialStatus: { in: ["approved", "translated", "released"] } },
            },
            {
              name: "relatedPeople",
              type: "relationship",
              relationTo: "people",
              hasMany: true,
              label: "Related people",
              access: { create: editorialField, update: editorialField },
              admin: { condition: siteAuthorshipCondition },
            },
            {
              name: "format",
              type: "select",
              access: { create: editorialField, update: editorialField },
              options: [
                { label: "Guide", value: "guide" },
                { label: "Reporting", value: "reporting" },
                { label: "Analysis", value: "analysis" },
                { label: "First person", value: "first_person" },
                { label: "Update", value: "update" },
              ],
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
              fields: [
                { name: "label", type: "text", required: true },
                { name: "url", type: "text" },
                { name: "checkedAt", type: "date", label: "Checked" },
                {
                  name: "check",
                  type: "textarea",
                  label: "Check",
                  access: { read: ownArticleFieldOrEditorial },
                },
              ],
            },
            {
              name: "editorComments",
              type: "array",
              label: "Comments",
              access: {
                create: editorialField,
                read: ownArticleFieldOrEditorial,
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
              name: "assignedEditor",
              type: "relationship",
              relationTo: "users",
              access: {
                create: editorialField,
                read: ownArticleFieldOrEditorial,
                update: editorialField,
              },
              filterOptions: { role: { in: ["editor", "super_admin"] } },
            },
            {
              name: "freshnessDate",
              type: "date",
              label: "Freshness date",
              access: { create: editorialField, update: editorialField },
              admin: { date: { pickerAppearance: "dayOnly" } },
            },
            {
              name: "publishedAt",
              type: "date",
              label: "Public since",
              access: { create: editorialField, update: editorialField },
              admin: { readOnly: true },
            },
            {
              name: "seo",
              type: "group",
              label: "Search and sharing",
              access: { create: editorialField, update: editorialField },
              fields: [
                { name: "title", type: "text", maxLength: 70 },
                { name: "description", type: "textarea", maxLength: 180 },
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  admin: { components: { Field: "/cms/components/AccessibleUploadField#AccessibleUploadField" } },
                },
              ],
            },
            {
              name: "homepagePlacement",
              type: "select",
              label: "Homepage",
              defaultValue: "none",
              access: { create: editorialField, read: ownArticleFieldOrEditorial, update: editorialField },
              options: [
                { label: "None", value: "none" },
                { label: "Lead", value: "lead" },
                { label: "Selected", value: "selected" },
              ],
            },
            {
              name: "homepageStartsAt",
              type: "date",
              label: "Homepage starts",
              access: { create: editorialField, read: ownArticleFieldOrEditorial, update: editorialField },
            },
            {
              name: "homepageEndsAt",
              type: "date",
              label: "Homepage ends",
              access: { create: editorialField, read: ownArticleFieldOrEditorial, update: editorialField },
            },
            {
              name: "curationActions",
              type: "ui",
              admin: { components: { Field: "/cms/components/WorkflowActions#CurationActions" } },
            },
          ],
        },
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
      name: "owner",
      type: "relationship",
      relationTo: "users",
      required: true,
      access: { read: ownArticleFieldOrEditorial, update: editorialField },
      admin: { hidden: true },
    },
    {
      name: "publicationStatus",
      type: "select",
      required: true,
      defaultValue: "draft",
      access: { read: ownArticleFieldOrEditorial },
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
      access: { read: ownArticleFieldOrEditorial },
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
  ],
};
