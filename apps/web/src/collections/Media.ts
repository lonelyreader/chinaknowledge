import path from "node:path";
import type { CollectionConfig } from "payload";

import { authenticated, authenticatedField, editorial } from "@/cms/access";
import { isCMSUser } from "@/cms/roles";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Image", plural: "Images" },
  admin: { useAsTitle: "alt", group: "Editorial", hideAPIURL: true },
  access: {
    create: authenticated,
    delete: editorial,
    read: () => true,
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
    beforeChange: [
      ({ data, req }) => {
        if (!data.uploadedBy && isCMSUser(req.user)) data.uploadedBy = req.user.id;
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
      access: { read: authenticatedField, update: () => false },
      admin: { position: "sidebar", readOnly: true },
    },
  ],
};
