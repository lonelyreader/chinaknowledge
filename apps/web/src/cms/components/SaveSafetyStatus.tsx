"use client";

import { useAuth, useDocumentInfo, useFormProcessing } from "@payloadcms/ui";

import { usePendingFormChanges } from "../use-pending-form-changes";

function editorName(value: ReturnType<typeof useDocumentInfo>["currentEditor"]) {
  if (!value || typeof value !== "object") return null;
  if ("displayName" in value && typeof value.displayName === "string") return value.displayName;
  if ("email" in value && typeof value.email === "string") return value.email;
  return null;
}

export function SaveSafetyStatus() {
  const pendingChanges = usePendingFormChanges();
  const processing = useFormProcessing();
  const { user } = useAuth();
  const { currentEditor, documentIsLocked } = useDocumentInfo();
  const lockedBy = editorName(currentEditor);
  const currentEditorID = currentEditor && typeof currentEditor === "object" && "id" in currentEditor
    ? String(currentEditor.id)
    : typeof currentEditor === "number" || typeof currentEditor === "string"
      ? String(currentEditor)
      : null;
  const lockedBySomeoneElse = Boolean(
    documentIsLocked && currentEditorID && String(user?.id) !== currentEditorID,
  );
  const state = lockedBySomeoneElse
    ? lockedBy ? `Locked · ${lockedBy}` : "Locked"
    : processing
      ? "Saving"
      : pendingChanges
        ? "Unsaved"
        : "Saved";

  return <div className="save-safety" role="status">{state}</div>;
}
