import type { CollectionConfig } from "payload";

import { editorial, editorialField, readPublicPlacesOrEditorial } from "@/cms/access";
import { enforcePlacePublication, preparePlace } from "@/cms/place-hooks";

export const Places: CollectionConfig = {
  slug: "places",
  labels: { singular: "Place", plural: "Places" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "locale", "status", "updatedAt"],
    group: "Editorial",
    hidden: ({ user }) => user?.role !== "super_admin",
    hideAPIURL: true,
  },
  access: {
    create: editorial,
    delete: editorial,
    read: readPublicPlacesOrEditorial,
    update: editorial,
  },
  hooks: {
    beforeValidate: [preparePlace],
    beforeChange: [enforcePlacePublication],
  },
  versions: { maxPerDoc: 30 },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "summary", type: "textarea", required: true },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      label: "Cover image",
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
    {
      name: "geography",
      type: "relationship",
      relationTo: "taxonomies",
      filterOptions: { dimension: { equals: "geography" } },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      access: { create: editorialField, read: editorialField, update: editorialField },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Public", value: "public" },
        { label: "Paused", value: "paused" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "publishedAt",
      type: "date",
      label: "Public since",
      access: { create: editorialField, update: editorialField },
      admin: { position: "sidebar", readOnly: true },
    },
  ],
};
