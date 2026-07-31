import type { PayloadRequest } from "payload";
import { APIError } from "payload";

import { hasEditorialRole, isCMSUser } from "./roles";

export type MediaRelation = number | string | { id: number | string } | null | undefined;

export function relationID(value: MediaRelation) {
  if (value && typeof value === "object") return value.id;
  return value;
}

export async function assertMediaApprovedForPublicUse(
  value: MediaRelation,
  req: PayloadRequest,
  label: string,
) {
  const id = relationID(value);
  if (!id) throw new APIError(`${label} is required before publication.`, 400);

  const media = await req.payload.findByID({
    collection: "media",
    depth: 0,
    id,
    overrideAccess: true,
    req,
  });
  if (!media.publicUseApprovedAt) {
    throw new APIError(`${label} must be approved for public use before publication.`, 400);
  }
}

export async function markMediaForMemberPublication(
  value: MediaRelation,
  req: PayloadRequest,
  label: string,
) {
  const media = await assertMediaAllowedForMemberPublication(value, req, label);
  if (!media.memberUsePublishedAt) {
    await req.payload.update({
      collection: "media",
      id: media.id,
      context: { memberPublicationMediaSync: true },
      data: { memberUsePublishedAt: new Date().toISOString() },
      overrideAccess: true,
      req,
    });
  }
}

export async function assertMediaAllowedForMemberPublication(
  value: MediaRelation,
  req: PayloadRequest,
  label: string,
) {
  const id = relationID(value);
  if (!id) throw new APIError(`${label} is required before publication.`, 400);
  const media = await req.payload.findByID({
    collection: "media",
    depth: 0,
    id,
    overrideAccess: true,
    req,
  });
  const uploader = relationID(media.uploadedBy);
  if (
    isCMSUser(req.user) &&
    !hasEditorialRole(req.user) &&
    uploader !== req.user.id &&
    !media.publicUseApprovedAt
  ) {
    throw new APIError(`${label} must belong to the member publishing it.`, 403);
  }
  return media;
}
