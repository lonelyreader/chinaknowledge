import type { CollectionConfig } from "payload";

import {
  authenticatedField,
  editorial,
  editorialField,
  readPublicPeopleOrOwn,
  updateOwnPersonOrEditorial,
} from "@/cms/access";
import { enforcePersonPublication } from "@/cms/people-hooks";

export const People: CollectionConfig = {
  slug: "people",
  labels: { singular: "Person", plural: "People" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "city", "profileStatus", "updatedAt"],
    group: "People",
    hideAPIURL: true,
  },
  access: {
    create: editorial,
    delete: editorial,
    read: readPublicPeopleOrOwn,
    update: updateOwnPersonOrEditorial,
  },
  hooks: { beforeChange: [enforcePersonPublication] },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "identity", type: "text", required: true, label: "Identity" },
    { name: "introduction", type: "textarea", required: true, label: "Introduction" },
    { name: "city", type: "text", required: true },
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
      required: true,
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
      access: { create: editorialField, read: authenticatedField, update: editorialField },
      admin: { position: "sidebar" },
    },
    {
      name: "profileStatus",
      type: "select",
      required: true,
      defaultValue: "draft",
      access: { create: editorialField, read: authenticatedField, update: editorialField },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Public", value: "public" },
        { label: "Paused", value: "paused" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "authorApprovalRecordedAt",
      type: "date",
      label: "Author approval recorded",
      access: { create: editorialField, read: authenticatedField, update: editorialField },
      admin: { position: "sidebar" },
    },
    {
      name: "profilePublishedAt",
      type: "date",
      label: "Profile published",
      access: { create: editorialField, read: authenticatedField, update: editorialField },
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "spotlightExcluded",
      type: "checkbox",
      label: "Exclude from spotlight",
      defaultValue: false,
      access: { create: editorialField, update: editorialField },
      admin: { position: "sidebar" },
    },
    {
      name: "spotlightPinnedUntil",
      type: "date",
      label: "Spotlight pinned until",
      access: { create: editorialField, update: editorialField },
      admin: { position: "sidebar" },
    },
  ],
};
