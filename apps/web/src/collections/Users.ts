import type { CollectionConfig } from "payload";

import {
  readUsers,
  superAdmin,
  superAdminField,
  updateOwnUserOrSuperAdmin,
} from "@/cms/access";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "User", plural: "Users" },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "updatedAt"],
    group: "People",
    hideAPIURL: true,
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: superAdmin,
    delete: superAdmin,
    read: readUsers,
    update: updateOwnUserOrSuperAdmin,
  },
  fields: [
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "author",
      options: [
        { label: "Author", value: "author" },
        { label: "Editor", value: "editor" },
        { label: "Super Admin", value: "super_admin" },
      ],
      access: {
        create: superAdminField,
        update: superAdminField,
      },
    },
    {
      name: "displayName",
      type: "text",
      required: true,
      label: "Name",
    },
  ],
};
