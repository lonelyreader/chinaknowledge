import { randomUUID } from "node:crypto";
import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";

import { assertMediaApprovedForPublicUse } from "./media-policy";

type PlaceShape = {
  coverImage?: number | string | { id: number | string } | null;
  geography?: number | string | { id: number | string } | null;
  id: number | string;
  locale?: "en" | "es";
  publishedAt?: string | null;
  slug?: string;
  status?: "draft" | "public" | "paused";
  translationGroup?: string;
};

function relationID(value: PlaceShape["geography"]) {
  if (value && typeof value === "object") return value.id;
  return value;
}

export const preparePlace: CollectionBeforeValidateHook<PlaceShape> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data;
  if (operation === "create") {
    data.translationGroup ||= randomUUID();
    data.status = "draft";
  }

  const locale = data.locale ?? originalDoc?.locale;
  const slug = data.slug ?? originalDoc?.slug;
  const geography = relationID(data.geography ?? originalDoc?.geography);
  if (!locale || !slug || !geography) return data;

  const duplicate = await req.payload.find({
    collection: "places",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { locale: { equals: locale } },
        {
          or: [
            { slug: { equals: slug } },
            { geography: { equals: geography } },
          ],
        },
        ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
      ],
    },
  });
  if (duplicate.docs.length) {
    throw new APIError("A place for this URL or geography already exists in this language.", 400);
  }
  return data;
};

export const enforcePlacePublication: CollectionBeforeChangeHook<PlaceShape> = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data;
  const nextStatus = data.status ?? originalDoc?.status ?? "draft";
  if (nextStatus !== "public") return data;

  const coverImage = data.coverImage ?? originalDoc?.coverImage;
  const geography = relationID(data.geography ?? originalDoc?.geography);
  const locale = data.locale ?? originalDoc?.locale;
  if (!coverImage) throw new APIError("A cover image is required before a place can be public.", 400);
  await assertMediaApprovedForPublicUse(coverImage, req, "Cover image");
  if (!geography) throw new APIError("A geography is required before a place can be public.", 400);
  if (!locale) throw new APIError("A language is required before a place can be public.", 400);

  const related = await req.payload.find({
    collection: "articles",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { locale: { equals: locale } },
        { geographies: { contains: geography } },
        { workflowStatus: { equals: "public" } },
        { _status: { equals: "published" } },
      ],
    },
  });
  if (!related.docs.length) {
    throw new APIError("A place needs related public content in the same language.", 400);
  }

  if ((originalDoc?.status ?? "draft") !== "public") {
    data.publishedAt ||= new Date().toISOString();
  }
  return data;
};
