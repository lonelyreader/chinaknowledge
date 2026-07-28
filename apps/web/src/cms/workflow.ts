import { APIError } from "payload";

export const publicationStatuses = ["draft", "published", "withdrawn"] as const;
export const curationStatuses = [
  "not_selected",
  "selected",
  "editing",
  "curated",
  "needs_recheck",
  "removed",
] as const;

export type PublicationStatus = (typeof publicationStatuses)[number];
export type CurationStatus = (typeof curationStatuses)[number];

const publicationTransitions: Record<PublicationStatus, readonly PublicationStatus[]> = {
  draft: ["draft", "published"],
  published: ["published", "withdrawn"],
  withdrawn: ["withdrawn", "published"],
};

const curationTransitions: Record<CurationStatus, readonly CurationStatus[]> = {
  not_selected: ["not_selected", "selected"],
  selected: ["selected", "editing", "curated", "removed"],
  editing: ["editing", "selected", "curated", "removed"],
  curated: ["curated", "needs_recheck", "removed"],
  needs_recheck: ["needs_recheck", "editing", "curated", "removed"],
  removed: ["removed", "selected"],
};

export function assertPublicationTransition(
  from: PublicationStatus,
  to: PublicationStatus,
) {
  if (!publicationTransitions[from].includes(to)) {
    throw new APIError(`The ${from} to ${to} publication transition is not allowed.`, 403);
  }
}

export function assertCurationTransition(from: CurationStatus, to: CurationStatus) {
  if (!curationTransitions[from].includes(to)) {
    throw new APIError(`The ${from} to ${to} curation transition is not allowed.`, 403);
  }
}

export function isPublicationStatus(value: unknown): value is PublicationStatus {
  return publicationStatuses.includes(value as PublicationStatus);
}

export function isCurationStatus(value: unknown): value is CurationStatus {
  return curationStatuses.includes(value as CurationStatus);
}
