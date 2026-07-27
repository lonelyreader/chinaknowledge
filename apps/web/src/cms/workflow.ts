import { APIError } from "payload";

import type { Role } from "./roles";

export const workflowStatuses = [
  "draft",
  "submitted",
  "in_review",
  "changes_requested",
  "approved",
  "public",
  "archived",
] as const;

export type WorkflowStatus = (typeof workflowStatuses)[number];

const authorTransitions: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  draft: ["draft", "submitted"],
  submitted: ["submitted"],
  in_review: ["in_review"],
  changes_requested: ["changes_requested", "submitted"],
  approved: ["approved"],
  public: ["public"],
  archived: ["archived"],
};

const editorialTransitions: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  draft: ["draft", "submitted", "in_review"],
  submitted: ["submitted", "in_review", "changes_requested"],
  in_review: ["in_review", "changes_requested", "approved"],
  changes_requested: ["changes_requested", "in_review", "approved"],
  approved: ["approved", "public", "changes_requested"],
  public: ["public", "archived"],
  archived: ["archived", "draft"],
};

export function canTransition(
  role: Role,
  from: WorkflowStatus,
  to: WorkflowStatus,
) {
  const transitions = role === "author" ? authorTransitions : editorialTransitions;
  return transitions[from].includes(to);
}

export function assertWorkflowTransition(
  role: Role,
  from: WorkflowStatus,
  to: WorkflowStatus,
  publicationConfirmed: boolean,
) {
  if (!canTransition(role, from, to)) {
    throw new APIError(`The ${from} to ${to} transition is not allowed.`, 403);
  }

  if (to === "public" && (role === "author" || !publicationConfirmed)) {
    throw new APIError("Publication requires editorial confirmation.", 403);
  }
}

export function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return workflowStatuses.includes(value as WorkflowStatus);
}
