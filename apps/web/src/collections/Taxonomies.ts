import type { CollectionConfig } from "payload";

import { editorial } from "@/cms/access";

export const Taxonomies: CollectionConfig = {
  slug: "taxonomies",
  labels: { singular: "Category", plural: "Categories" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "dimension", "slug"],
    group: "Editorial",
    hidden: ({ user }) => user?.role !== "super_admin",
    hideAPIURL: true,
  },
  access: {
    create: editorial,
    delete: editorial,
    read: () => true,
    update: editorial,
  },
  fields: [
    {
      name: "dimension",
      type: "select",
      required: true,
      index: true,
      options: [
        { label: "Purpose", value: "purpose" },
        { label: "Topic", value: "topic" },
        { label: "Geography", value: "geography" },
        { label: "Situation", value: "situation" },
      ],
    },
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, index: true },
  ],
};
