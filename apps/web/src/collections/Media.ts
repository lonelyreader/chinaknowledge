import path from "node:path";
import type { CollectionConfig } from "payload";

import {
  authenticated,
  authenticatedField,
  editorial,
  editorialField,
  readApprovedMediaOrOwn,
  updateOwnMediaOrEditorial,
} from "@/cms/access";
import { normalizeUploadBuffers } from "@/cms/media-hooks";
import { hasEditorialRole, isCMSUser } from "@/cms/roles";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Image", plural: "Images" },
  admin: {
    useAsTitle: "alt",
    group: "Editorial",
    hideAPIURL: true,
  },
  access: {
    create: authenticated,
    delete: editorial,
    read: readApprovedMediaOrOwn,
    update: updateOwnMediaOrEditorial,
  },
  upload: {
    staticDir: path.resolve(process.cwd(), "media"),
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "card", width: 800, height: 600, position: "centre" },
    ],
  },
  hooks: {
    afterChange: [normalizeUploadBuffers],
    beforeChange: [
      ({ data, operation, originalDoc, req }) => {
        if (operation === "create" && isCMSUser(req.user)) data.uploadedBy = req.user.id;
        const wasApproved = Boolean(originalDoc?.publicUseApprovedAt);
        const isApproved = Boolean(data.publicUseApprovedAt ?? originalDoc?.publicUseApprovedAt);
        if (!wasApproved && isApproved && isCMSUser(req.user)) {
          data.publicUseApprovedBy = req.user.id;
        }
        if (wasApproved && data.publicUseApprovedAt === null) {
          data.publicUseApprovedBy = null;
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "alt", type: "text", required: true, label: "Image description" },
    {
      name: "uploadedBy",
      type: "relationship",
      relationTo: "users",
      access: { create: () => false, read: authenticatedField, update: () => false },
      admin: { hidden: true },
    },
    {
      name: "memberUsePublishedAt",
      type: "date",
      access: { create: () => false, read: authenticatedField, update: () => false },
      admin: { hidden: true },
    },
    {
      name: "publicUseApprovedAt",
      type: "date",
      label: "Approved for public use",
      access: { create: editorialField, read: authenticatedField, update: editorialField },
      admin: {
        components: {
          Field: "/cms/components/PublicUseApprovalField#PublicUseApprovalField",
        },
        condition: (_data, _siblingData, { user }) =>
          isCMSUser(user) && hasEditorialRole(user),
      },
    },
    {
      name: "publicUseApprovedBy",
      type: "relationship",
      relationTo: "users",
      access: { create: () => false, read: authenticatedField, update: () => false },
      admin: { hidden: true },
    },
  ],
};
