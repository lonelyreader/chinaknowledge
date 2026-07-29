"use client";

import { Button, toast, useAuth, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useEffect, useState } from "react";

import type { Article, User } from "@/payload-types";
import { buildPublicationSummary, type PublicationSummary } from "../publication-summary";
import { usePendingFormChanges } from "../use-pending-form-changes";
import type { CurationStatus, PublicationStatus } from "../workflow";

type Transition = {
  axis: "publication" | "curation";
  label: string;
  status: CurationStatus | PublicationStatus;
  style?: "error" | "primary" | "secondary";
};

const publicationLabels: Record<PublicationStatus, string> = {
  draft: "Draft",
  published: "Public",
  withdrawn: "Withdrawn",
};
const curationLabels: Record<CurationStatus, string> = {
  curated: "Site selected",
  editing: "Editing",
  needs_recheck: "Needs recheck",
  not_selected: "Not selected",
  removed: "Removed",
  selected: "Selected",
};

function publicationActions(status: PublicationStatus): Transition[] {
  if (status === "draft") return [{ axis: "publication", label: "Publish", status: "published" }];
  if (status === "withdrawn") return [{ axis: "publication", label: "Republish", status: "published" }];
  return [
    { axis: "publication", label: "Update public article", status: "published" },
    { axis: "publication", label: "Withdraw", status: "withdrawn", style: "secondary" },
  ];
}

function curationActions(status: CurationStatus): Transition[] {
  switch (status) {
    case "not_selected":
    case "removed":
      return [{ axis: "curation", label: "Select", status: "selected" }];
    case "selected":
      return [
        { axis: "curation", label: "Edit", status: "editing", style: "secondary" },
        { axis: "curation", label: "Add to site", status: "curated" },
        { axis: "curation", label: "Remove", status: "removed", style: "secondary" },
      ];
    case "editing":
    case "needs_recheck":
      return [
        { axis: "curation", label: "Add to site", status: "curated" },
        { axis: "curation", label: "Remove", status: "removed", style: "secondary" },
      ];
    case "curated":
      return [{ axis: "curation", label: "Remove from site", status: "removed", style: "secondary" }];
  }
}

function relationID(value: unknown) {
  if (value && typeof value === "object") {
    if ("value" in value) return (value as { value: unknown }).value;
    if ("id" in value) return (value as { id: unknown }).id;
  }
  return value;
}

function requiresConfirmation(action: Transition) {
  return action.status === "withdrawn" || action.status === "removed";
}

export function WorkflowActions({ axis = "both" }: { axis?: "both" | "curation" | "publication" }) {
  const { user } = useAuth<User>();
  const { id } = useDocumentInfo();
  const pendingChanges = usePendingFormChanges();
  const publicationValue = useFormFields<unknown>(([fields]) => fields.publicationStatus?.value);
  const curationValue = useFormFields<unknown>(([fields]) => fields.curationStatus?.value);
  const [remotePublication, setRemotePublication] = useState<PublicationStatus | null>(null);
  const [remoteCuration, setRemoteCuration] = useState<CurationStatus | null>(null);
  const publication = typeof publicationValue === "string" && publicationValue in publicationLabels
    ? publicationValue as PublicationStatus
    : remotePublication ?? "draft";
  const curation = typeof curationValue === "string" && curationValue in curationLabels
    ? curationValue as CurationStatus
    : remoteCuration ?? "not_selected";
  const editorial = user?.role === "editor" || user?.role === "super_admin";
  const [owner, setOwner] = useState(false);
  const [pending, setPending] = useState<Transition | null>(null);
  const [summary, setSummary] = useState<PublicationSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user?.id) return;
    let current = true;
    void fetch(`/api/articles/${id}?depth=0&draft=true`)
      .then(async (response) => response.ok ? response.json() as Promise<Article> : null)
      .then((article) => {
        if (!current || !article) return;
        setOwner(String(relationID(article.owner)) === String(user.id));
        if (article.publicationStatus) setRemotePublication(article.publicationStatus);
        if (article.curationStatus) setRemoteCuration(article.curationStatus);
      });
    return () => { current = false; };
  }, [id, user?.id]);

  async function transition(action: Transition) {
    if (!id) return;
    setPending(action);
    try {
      const response = await fetch(`/api/articles/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ axis: action.axis, confirmed: true, status: action.status }),
      });
      const data = (await response.json()) as { errors?: { message?: string }[] };
      if (!response.ok) throw new Error(data.errors?.[0]?.message ?? "Action failed.");
      toast.success(action.axis === "publication"
        ? publicationLabels[action.status as PublicationStatus]
        : curationLabels[action.status as CurationStatus]);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
      setPending(null);
    }
  }

  async function openCurationCheck(action: Transition) {
    if (!id) return;
    setPending(action);
    setSummary(null);
    setSummaryError(null);
    try {
      const response = await fetch(`/api/articles/${id}?depth=2&draft=true`);
      if (!response.ok) throw new Error("Curation details unavailable.");
      setSummary(buildPublicationSummary(await response.json() as Article));
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Curation details unavailable.");
    }
  }

  async function notifyAuthor() {
    if (!id) return;
    setPending({ axis: "curation", label: "Notify author", status: curation });
    try {
      const response = await fetch(`/api/articles/${id}/notify-author`, { method: "POST" });
      const data = await response.json() as { errors?: { message?: string }[]; notificationStatus?: string };
      if (!response.ok) throw new Error(data.errors?.[0]?.message ?? "Notification failed.");
      toast.success(data.notificationStatus === "sent" ? "Author notified" : "Notification recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Notification failed.");
    } finally {
      setPending(null);
    }
  }

  function selectAction(action: Transition) {
    if (action.status === "curated") {
      void openCurationCheck(action);
    } else if (requiresConfirmation(action)) {
      setPending(action);
    } else {
      void transition(action);
    }
  }

  if (!id) return null;

  return (
    <section className="workflow-actions">
      {owner && axis !== "curation" ? (
        <div className="workflow-actions__group workflow-actions__group--publication">
          <span className="workflow-actions__label">Personal publication</span>
          <strong className="workflow-actions__status">{publicationLabels[publication]}</strong>
          <div className="workflow-actions__buttons">
            {publicationActions(publication).map((action) => (
              <Button
                buttonStyle={action.style ?? "primary"}
                disabled={pendingChanges || pending !== null}
                key={`${action.axis}-${action.status}`}
                onClick={() => selectAction(action)}
                size="small"
              >{action.label}</Button>
            ))}
          </div>
        </div>
      ) : null}

      {editorial && axis !== "publication" ? (
        <div className="workflow-actions__group workflow-actions__group--curation">
          <span className="workflow-actions__label">Site curation</span>
          <strong className="workflow-actions__status">{curationLabels[curation]}</strong>
          <div className="workflow-actions__buttons">
            {curationActions(curation).map((action) => (
              <Button
                buttonStyle={action.style ?? "primary"}
                disabled={pendingChanges || pending !== null}
                key={`${action.axis}-${action.status}`}
                onClick={() => selectAction(action)}
                size="small"
              >{action.label}</Button>
            ))}
            <Button
              buttonStyle="secondary"
              disabled={pendingChanges || pending !== null}
              onClick={() => void notifyAuthor()}
              size="small"
            >Notify author</Button>
          </div>
        </div>
      ) : null}

      {pending?.status === "curated" ? (
        <div className="publication-check">
          <strong className="publication-check__title">Site check</strong>
          {summaryError ? <span className="publication-check__error" role="alert">{summaryError}</span> : null}
          {summary ? (
            <dl className="publication-check__details">
              <div><dt>Title</dt><dd>{summary.title}</dd></div>
              <div><dt>Author</dt><dd>{summary.author}</dd></div>
              <div><dt>Section</dt><dd>{summary.object}</dd></div>
              <div><dt>Language</dt><dd>{summary.language}</dd></div>
              <div><dt>URL</dt><dd>{summary.url}</dd></div>
              <div><dt>Cover</dt><dd>{summary.cover}</dd></div>
              <div><dt>Sources</dt><dd>{summary.sources}</dd></div>
              <div><dt>Classification</dt><dd>{summary.classification}</dd></div>
              <div><dt>Freshness</dt><dd>{summary.freshness}</dd></div>
            </dl>
          ) : null}
          {summary?.missing.length ? <span className="publication-check__error">Missing: {summary.missing.join(", ")}</span> : null}
          <div className="workflow-actions__buttons">
            <Button
              buttonStyle="primary"
              disabled={pendingChanges || !summary || summary.missing.length > 0}
              onClick={() => void transition(pending)}
              size="small"
            >Confirm</Button>
            <Button buttonStyle="secondary" onClick={() => setPending(null)} size="small">Cancel</Button>
          </div>
        </div>
      ) : null}

      {pending && requiresConfirmation(pending) ? (
        <div className="publication-check">
          <strong className="publication-check__title">
            {pending.status === "withdrawn" ? "Withdraw article?" : "Remove from site?"}
          </strong>
          <div className="workflow-actions__buttons">
            <Button buttonStyle="primary" disabled={pendingChanges} onClick={() => void transition(pending)} size="small">Confirm</Button>
            <Button buttonStyle="secondary" onClick={() => setPending(null)} size="small">Cancel</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function PublicationActions() {
  return <WorkflowActions axis="publication" />;
}

export function CurationActions() {
  return <WorkflowActions axis="curation" />;
}
