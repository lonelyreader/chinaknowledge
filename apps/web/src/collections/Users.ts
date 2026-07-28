import type { CollectionConfig } from "payload";

import {
  readUsers,
  superAdmin,
  superAdminField,
  updateOwnUserOrSuperAdmin,
} from "@/cms/access";
import { ensureMemberProfile, protectMemberAccount, requireActiveAccount } from "@/cms/user-hooks";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "User", plural: "Users" },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "accountStatus", "updatedAt"],
    group: "People",
    hidden: ({ user }) => user?.role === "author",
    hideAPIURL: true,
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
  },
  access: {
    admin: ({ req }) => Boolean(req.user && req.user.accountStatus !== "paused"),
    create: superAdmin,
    delete: superAdmin,
    read: readUsers,
    update: updateOwnUserOrSuperAdmin,
  },
  hooks: {
    afterChange: [ensureMemberProfile],
    beforeDelete: [protectMemberAccount],
    beforeLogin: [requireActiveAccount],
  },
  fields: [
    {
      name: "accountStatus",
      type: "select",
      required: true,
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Paused", value: "paused" },
      ],
      access: {
        create: superAdminField,
        update: superAdminField,
      },
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "author",
      options: [
        { label: "Member", value: "author" },
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
