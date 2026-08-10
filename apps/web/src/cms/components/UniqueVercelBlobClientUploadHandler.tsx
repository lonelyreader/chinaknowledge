"use client";

import { createClientUploadHandler, getFileKey } from "@payloadcms/plugin-cloud-storage/client";
import { upload } from "@vercel/blob/client";
import { formatAdminURL } from "payload/shared";

import { uniqueMediaUploadFilename } from "@/cms/media-upload-filename";

function posixBasename(key: string) {
  const normalized = key.replace(/^\/+/, "");
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
}

export const UniqueVercelBlobClientUploadHandler = createClientUploadHandler({
  handler: async ({
    apiRoute,
    collectionSlug,
    docPrefix,
    extra,
    file,
    prefix,
    serverHandlerPath,
    serverURL,
    updateFilename,
  }) => {
    const useCompositePrefixes = extra.useCompositePrefixes === true;
    const endpointRoute = formatAdminURL({
      apiRoute,
      path: serverHandlerPath,
      serverURL,
    });
    const uniqueFilename = uniqueMediaUploadFilename(file.name, crypto.randomUUID());
    const { fileKey: pathname, sanitizedDocPrefix } = getFileKey({
      collectionPrefix: prefix,
      docPrefix,
      filename: uniqueFilename,
      useCompositePrefixes,
    });
    const result = await upload(pathname, file, {
      access: "public",
      clientPayload: collectionSlug,
      contentType: file.type,
      handleUploadUrl: endpointRoute,
    });

    updateFilename(decodeURIComponent(posixBasename(result.pathname)));
    return { prefix: sanitizedDocPrefix };
  },
});
