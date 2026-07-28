import type { CollectionConfig } from "payload";

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

const editorialCondition = (_data: unknown, _siblingData: unknown, { user }: { user: unknown }) =>
  isCMSUser(user) && hasEditorialRole(user);

export const People: CollectionConfig = {
  slug: "people",
  labels: { singular: "Person", plural: "People" },
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
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      access: { update: editorialField },
      admin: { condition: editorialCondition },
    },
    { name: "identity", type: "text", label: "Identity" },
    { name: "introduction", type: "textarea", label: "Introduction" },
    { name: "city", type: "text" },
    {
      name: "portrait",
      type: "upload",
      relationTo: "media",
      label: "Portrait",
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
    {
      name: "links",
      type: "array",
      maxRows: 8,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "url", type: "text", required: true },
      ],
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      unique: true,
      access: { create: editorialField, read: ownPersonFieldOrEditorial, update: editorialField },
      admin: { condition: editorialCondition, position: "sidebar" },
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
      admin: { condition: editorialCondition, position: "sidebar" },
    },
    {
      name: "profilePublishedAt",
      type: "date",
      label: "Profile published",
      access: { create: editorialField, read: ownPersonFieldOrEditorial, update: authenticatedField },
      admin: { condition: editorialCondition, position: "sidebar", readOnly: true },
    },
    {
      name: "spotlightExcluded",
      type: "checkbox",
      label: "Exclude from spotlight",
      defaultValue: false,
      access: { create: editorialField, update: editorialField },
      admin: { condition: editorialCondition, position: "sidebar" },
    },
    {
      name: "spotlightPinnedUntil",
      type: "date",
      label: "Spotlight pinned until",
      access: { create: editorialField, update: editorialField },
      admin: { condition: editorialCondition, position: "sidebar" },
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
