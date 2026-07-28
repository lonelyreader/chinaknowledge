"use client";

import {
  Button,
  toast,
  useAuth,
  useDocumentInfo,
  useFormFields,
  useFormModified,
} from "@payloadcms/ui";
import { useState } from "react";

import type { Article, User } from "@/payload-types";
import {
  buildPublicationSummary,
  type PublicationSummary,
} from "../publication-summary";
import type { WorkflowStatus } from "../workflow";

type Action = {
  label: string;
  status: WorkflowStatus;
  style?: "error" | "primary" | "secondary";
};

const statusLabels: Record<WorkflowStatus, string> = {
  approved: "Approved",
  archived: "Archived",
  changes_requested: "Changes requested",
  draft: "Draft",
  in_review: "In review",
  public: "Public",
  submitted: "Submitted",
};

function actionsFor(role: User["role"] | null | undefined, status: WorkflowStatus): Action[] {
  if (role === "author") {
    if (status === "draft") return [{ label: "Submit for review", status: "submitted" }];
    if (status === "changes_requested") return [{ label: "Resubmit", status: "submitted" }];
    return [];
  }

  if (role !== "editor" && role !== "super_admin") return [];

  switch (status) {
    case "draft":
    case "submitted":
      return [{ label: "Start review", status: "in_review" }];
    case "in_review":
      return [
        { label: "Request changes", status: "changes_requested", style: "secondary" },
        { label: "Approve", status: "approved" },
      ];
    case "changes_requested":
      return [{ label: "Resume review", status: "in_review" }];
    case "approved":
      return [
        { label: "Request changes", status: "changes_requested", style: "secondary" },
        { label: "Publish", status: "public" },
      ];
    case "public":
      return [{ label: "Archive", status: "archived", style: "secondary" }];
    case "archived":
      return [{ label: "Return to draft", status: "draft", style: "secondary" }];
  }
}

export function WorkflowActions() {
  const { user } = useAuth<User>();
  const { id } = useDocumentInfo();
  const modified = useFormModified();
  const formStatus = useFormFields<unknown>(([fields]) => fields.workflowStatus?.value);
  const status = typeof formStatus === "string" && formStatus in statusLabels
    ? (formStatus as WorkflowStatus)
    : "draft";
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState<WorkflowStatus | null>(null);
  const [summary, setSummary] = useState<PublicationSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryPending, setSummaryPending] = useState(false);
  const actions = actionsFor(user?.role, status);

  async function openPublishConfirmation() {
    if (!id) return;
    setConfirming(true);
    setSummary(null);
    setSummaryError(null);
    setSummaryPending(true);
    try {
      const response = await fetch(`/api/articles/${id}?depth=2&draft=true`);
      if (!response.ok) throw new Error("Publication details unavailable.");
      const article = (await response.json()) as Article;
      setSummary(buildPublicationSummary(article));
    } catch (error) {
      setSummaryError(
        error instanceof Error ? error.message : "Publication details unavailable.",
      );
    } finally {
      setSummaryPending(false);
    }
  }

  async function transition(target: WorkflowStatus, confirmed = false) {
    if (!id) return;
    setPending(target);
    try {
      const response = await fetch(`/api/articles/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed, status: target }),
      });
      const data = (await response.json()) as { errors?: { message?: string }[] };
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message ?? "Transition failed.");
      }
      toast.success(statusLabels[target]);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transition failed.");
      setPending(null);
    }
  }

  if (!id) return null;

  return (
    <section className="workflow-actions">
      <span className="workflow-actions__label">Editorial status</span>
      <strong className="workflow-actions__status">{statusLabels[status]}</strong>
      {confirming ? (
        <div className="publication-check" aria-busy={summaryPending}>
          <strong className="publication-check__title">Publication check</strong>
          {summaryPending ? <span className="publication-check__state">Loading</span> : null}
          {summaryError ? (
            <span className="publication-check__error" role="alert">{summaryError}</span>
          ) : null}
          {summary ? (
            <dl className="publication-check__details">
              <div><dt>Title</dt><dd>{summary.title}</dd></div>
              <div><dt>Author</dt><dd>{summary.author}</dd></div>
              <div><dt>Object</dt><dd>{summary.object}</dd></div>
              <div><dt>Language</dt><dd>{summary.language}</dd></div>
              <div><dt>URL</dt><dd>{summary.url}</dd></div>
              <div><dt>Cover</dt><dd>{summary.cover}</dd></div>
              <div><dt>Sources</dt><dd>{summary.sources}</dd></div>
              <div><dt>Classification</dt><dd>{summary.classification}</dd></div>
              <div><dt>Freshness</dt><dd>{summary.freshness}</dd></div>
            </dl>
          ) : null}
          {summary?.missing.length ? (
            <span className="publication-check__error" role="alert">Missing: {summary.missing.join(", ")}</span>
          ) : null}
          <div className="workflow-actions__buttons">
            <Button
              buttonStyle="primary"
              disabled={pending !== null || summary === null || summary.missing.length > 0}
              onClick={() => void transition("public", true)}
              size="small"
            >
              Confirm publish
            </Button>
            {summaryError ? (
              <Button
                buttonStyle="secondary"
                disabled={summaryPending}
                onClick={() => void openPublishConfirmation()}
                size="small"
              >
                Retry
              </Button>
            ) : null}
            <Button
              buttonStyle="secondary"
              disabled={pending !== null}
              onClick={() => setConfirming(false)}
              size="small"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="workflow-actions__buttons">
          {actions.map((action) => (
            <Button
              buttonStyle={action.style ?? "primary"}
              disabled={modified || pending !== null}
              key={action.status}
              onClick={() => {
                if (action.status === "public") void openPublishConfirmation();
                else void transition(action.status);
              }}
              size="small"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}
