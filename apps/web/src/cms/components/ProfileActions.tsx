"use client";

import { Button, toast, useDocumentInfo, useFormFields, useFormModified } from "@payloadcms/ui";
import { useState } from "react";

type ProfileStatus = "draft" | "paused" | "public";

const labels: Record<ProfileStatus, string> = {
  draft: "Draft",
  paused: "Paused",
  public: "Public",
};

export function ProfileActions() {
  const { id } = useDocumentInfo();
  const modified = useFormModified();
  const statusValue = useFormFields<unknown>(([fields]) => fields.profileStatus?.value);
  const status: ProfileStatus = statusValue === "public" || statusValue === "paused"
    ? statusValue
    : "draft";
  const [pending, setPending] = useState<"draft" | "public" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function transition(next: "draft" | "public") {
    if (!id) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/people/${id}/profile-transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, status: next }),
      });
      const data = (await response.json()) as { errors?: { message?: string }[] };
      if (!response.ok) throw new Error(data.errors?.[0]?.message ?? "Action failed.");
      toast.success(labels[next]);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
      setPending(null);
      setSubmitting(false);
    }
  }

  if (!id) return null;

  return (
    <section className="workflow-actions">
      <div className="workflow-actions__group">
        <span className="workflow-actions__label">Profile</span>
        <strong className="workflow-actions__status">{labels[status]}</strong>
        {status !== "paused" ? (
          <div className="workflow-actions__buttons">
            <Button
              buttonStyle={status === "public" ? "secondary" : "primary"}
              disabled={modified || submitting || pending !== null}
              onClick={() => status === "public" ? setPending("draft") : void transition("public")}
              size="small"
            >{status === "public" ? "Make private" : "Publish profile"}</Button>
          </div>
        ) : null}
      </div>
      {pending === "draft" ? (
        <div className="publication-check">
          <strong className="publication-check__title">Make profile private?</strong>
          <div className="workflow-actions__buttons">
            <Button buttonStyle="primary" disabled={submitting} onClick={() => void transition("draft")} size="small">Confirm</Button>
            <Button buttonStyle="secondary" disabled={submitting} onClick={() => setPending(null)} size="small">Cancel</Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
