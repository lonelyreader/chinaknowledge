"use client";

import { useDocumentInfo, useFormModified, useFormProcessing } from "@payloadcms/ui";

function editorName(value: ReturnType<typeof useDocumentInfo>["currentEditor"]) {
  if (!value || typeof value !== "object") return null;
  if ("displayName" in value && typeof value.displayName === "string") return value.displayName;
  if ("email" in value && typeof value.email === "string") return value.email;
  return null;
}

export function SaveSafetyStatus() {
  const modified = useFormModified();
  const processing = useFormProcessing();
  const { currentEditor, documentIsLocked } = useDocumentInfo();
  const lockedBy = editorName(currentEditor);
  const state = documentIsLocked
    ? lockedBy ? `Locked · ${lockedBy}` : "Locked"
    : processing
      ? "Saving"
      : modified
        ? "Unsaved"
        : "Saved";

  return <div className="save-safety" role="status">{state}</div>;
}
