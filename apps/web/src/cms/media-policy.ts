import type { PayloadRequest } from "payload";
import { APIError } from "payload";

type MediaRelation = number | string | { id: number | string } | null | undefined;

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
