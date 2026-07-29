import type { CollectionConfig, TextFieldSingleValidation } from "payload";

import {
  authenticatedField,
  editorial,
  editorialField,
  ownPersonFieldOrEditorial,
  readOwnPersonVersionsOrEditorial,
  readPublicPeopleOrOwn,
  updateOwnPersonOrEditorial,
} from "@/cms/access";
import { enforcePersonPublication, protectPersonWithArticles } from "@/cms/people-hooks";
import { transitionProfileEndpoint } from "@/cms/people-endpoints";
import { hasEditorialRole, isCMSUser } from "@/cms/roles";
import { isValidEmailProfileLink, isValidWebProfileLink } from "@/cms/profile-links";

function relationID(value: unknown) {
  if (value && typeof value === "object") {
    if ("value" in value) return relationID((value as { value: unknown }).value);
    if ("id" in value) return (value as { id: unknown }).id;
  }
  return value;
}

const governanceCondition = (data: unknown, _siblingData: unknown, { user }: { user: unknown }) => {
  if (!isCMSUser(user) || !hasEditorialRole(user)) return false;
  const personUser = relationID((data as { user?: unknown } | null)?.user);
  return personUser == null || String(personUser) !== String(user.id);
};

const validateProfileLink: TextFieldSingleValidation = (value, { siblingData }) => {
  if (!value) return "Link address is required.";
  const row = siblingData as { type?: unknown } | undefined;
  const linkType = typeof row?.type === "string" ? row.type : "personal_site";
  if (linkType === "email") {
    return isValidEmailProfileLink(value) || "Enter a complete email address using mailto:.";
  }
  return isValidWebProfileLink(value) || "Links must use https:// or http://.";
};

export const People: CollectionConfig = {
  slug: "people",
  labels: { singular: "Person", plural: "People" },
  lockDocuments: { duration: 300 },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "city", "profileStatus", "updatedAt"],
    group: "People",
    hideAPIURL: true,
    preview: (doc) => {
      const locale = Array.isArray(doc.languages) && doc.languages[0] === "es" ? "es" : "en";
      return doc.id && doc.slug
        ? `/${locale}/people/${doc.slug}?preview=${encodeURIComponent(String(doc.id))}`
        : null;
    },
  },
  endpoints: [transitionProfileEndpoint],
  access: {
    create: editorial,
    delete: editorial,
    read: readPublicPeopleOrOwn,
    readVersions: readOwnPersonVersionsOrEditorial,
    update: updateOwnPersonOrEditorial,
  },
  hooks: {
    beforeChange: [enforcePersonPublication],
    beforeDelete: [protectPersonWithArticles],
  },
  versions: { maxPerDoc: 50 },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Profile",
          fields: [
            { name: "name", type: "text", required: true },
            {
              name: "portrait",
              type: "upload",
              relationTo: "media",
              label: "Portrait",
              admin: { components: { Field: "/cms/components/AccessibleUploadField#AccessibleUploadField" } },
            },
            {
              name: "languages",
              type: "select",
              hasMany: true,
              options: [
                { label: "English", value: "en" },
                { label: "Spanish", value: "es" },
              ],
            },
            {
              name: "topics",
              type: "relationship",
              relationTo: "taxonomies",
              hasMany: true,
              filterOptions: { dimension: { equals: "topic" } },
            },
          ],
        },
        {
          label: "English",
          fields: [
            { name: "identity", type: "text", label: "Identity" },
            { name: "city", type: "text", label: "Location" },
            { name: "introduction", type: "textarea", label: "Introduction" },
          ],
        },
        {
          label: "Español",
          fields: [
            { name: "identityEs", type: "text", label: "Identidad" },
            { name: "cityEs", type: "text", label: "Ubicación" },
            { name: "introductionEs", type: "textarea", label: "Presentación" },
          ],
        },
        {
          label: "Links",
          fields: [
            {
              name: "links",
              type: "array",
              maxRows: 8,
              admin: { components: { RowLabel: "/cms/components/ProfileLinkRowLabel#ProfileLinkRowLabel" } },
              fields: [
                {
                  name: "type",
                  type: "select",
                  required: true,
                  defaultValue: "personal_site",
                  options: [
                    { label: "Personal site", value: "personal_site" },
                    { label: "Newsletter", value: "newsletter" },
                    { label: "YouTube", value: "youtube" },
                    { label: "LinkedIn", value: "linkedin" },
                    { label: "X", value: "x" },
                    { label: "Instagram", value: "instagram" },
                    { label: "GitHub", value: "github" },
                    { label: "Email", value: "email" },
                    { label: "Other", value: "other" },
                  ],
                },
                { name: "label", type: "text", label: "English label", required: true },
                { name: "labelEs", type: "text", label: "Etiqueta en español" },
                { name: "url", type: "text", required: true, validate: validateProfileLink },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      access: { update: editorialField },
      admin: { condition: governanceCondition },
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      unique: true,
      access: { create: editorialField, read: ownPersonFieldOrEditorial, update: editorialField },
      admin: { condition: governanceCondition, position: "sidebar" },
    },
    {
      name: "profileStatus",
      type: "select",
      required: true,
      defaultValue: "draft",
      access: { create: editorialField, read: ownPersonFieldOrEditorial, update: authenticatedField },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Public", value: "public" },
        { label: "Paused", value: "paused" },
      ],
      admin: { hidden: true },
    },
    {
      name: "authorApprovalRecordedAt",
      type: "date",
      label: "Author approval recorded",
      access: { create: editorialField, read: ownPersonFieldOrEditorial, update: editorialField },
      admin: { condition: governanceCondition, position: "sidebar" },
    },
    {
      name: "profilePublishedAt",
      type: "date",
      label: "Profile published",
      access: { create: editorialField, read: ownPersonFieldOrEditorial, update: authenticatedField },
      admin: { condition: governanceCondition, position: "sidebar", readOnly: true },
    },
    {
      name: "spotlightExcluded",
      type: "checkbox",
      label: "Exclude from spotlight",
      defaultValue: false,
      access: { create: editorialField, read: editorialField, update: editorialField },
      admin: { condition: governanceCondition, position: "sidebar" },
    },
    {
      name: "spotlightPinnedUntil",
      type: "date",
      label: "Spotlight pinned until",
      access: { create: editorialField, read: editorialField, update: editorialField },
      admin: { condition: governanceCondition, position: "sidebar" },
    },
    {
      name: "profileActions",
      type: "ui",
      admin: {
        position: "sidebar",
        components: { Field: "/cms/components/ProfileActions#ProfileActions" },
      },
    },
  ],
};
