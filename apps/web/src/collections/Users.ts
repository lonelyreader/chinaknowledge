import type { CollectionConfig } from "payload";

import {
  createUserFromInvite,
  readUsers,
  superAdmin,
  superAdminField,
  updateOwnUserOrSuperAdmin,
} from "@/cms/access";
import { ensureMemberProfile, protectMemberAccount, requireActiveAccount } from "@/cms/user-hooks";
import { inviteUserEndpoint, resendUserInviteEndpoint } from "@/cms/user-endpoints";
import {
  generatePasswordResetEmailHTML,
  generatePasswordResetEmailSubject,
  PASSWORD_RESET_EXPIRATION_MS,
} from "@/cms/password-reset";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Member", plural: "Members" },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "accountStatus", "updatedAt"],
    group: "People",
    hidden: ({ user }) => user?.role !== "super_admin",
    hideAPIURL: true,
    components: {
      beforeListTable: ["/cms/components/InviteMember#InviteMember"],
    },
  },
  endpoints: [inviteUserEndpoint, resendUserInviteEndpoint],
  auth: {
    forgotPassword: {
      expiration: PASSWORD_RESET_EXPIRATION_MS,
      generateEmailHTML: generatePasswordResetEmailHTML,
      generateEmailSubject: generatePasswordResetEmailSubject,
    },
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
  },
  access: {
    admin: ({ req }) => Boolean(req.user && req.user.accountStatus !== "paused"),
    create: createUserFromInvite,
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
