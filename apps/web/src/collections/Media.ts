import path from "node:path";
import type { CollectionConfig } from "payload";

import {
  authenticated,
  authenticatedField,
  editorial,
  editorialField,
  readApprovedMediaOrOwn,
} from "@/cms/access";
import { normalizeUploadBuffers } from "@/cms/media-hooks";
import { isCMSUser } from "@/cms/roles";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Image", plural: "Images" },
  admin: { useAsTitle: "alt", group: "Editorial", hideAPIURL: true },
  access: {
    create: authenticated,
    delete: editorial,
    read: readApprovedMediaOrOwn,
    update: editorial,
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
    { name: "alt", type: "text", required: true, label: "Alt text" },
    {
      name: "uploadedBy",
      type: "relationship",
      relationTo: "users",
      access: { create: () => false, read: authenticatedField, update: () => false },
      admin: { position: "sidebar", readOnly: true },
    },
    {
      name: "publicUseApprovedAt",
      type: "date",
      label: "Public use approved",
      access: { create: editorialField, read: authenticatedField, update: editorialField },
      admin: { position: "sidebar" },
    },
    {
      name: "publicUseApprovedBy",
      type: "relationship",
      relationTo: "users",
      access: { create: () => false, read: authenticatedField, update: () => false },
      admin: { position: "sidebar", readOnly: true },
    },
  ],
};
