"use client";

import { useAuth, useDocumentInfo, useFormProcessing } from "@payloadcms/ui";
import { useEffect, useState } from "react";

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
  const [saveFailed, setSaveFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
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

  useEffect(() => {
    const originalFetch = window.fetch;
    const trackFailure = async (...args: Parameters<typeof window.fetch>) => {
      const input = args[0];
      const options = args[1];
      const request = input instanceof Request ? input : null;
      const method = (options?.method ?? request?.method ?? "GET").toUpperCase();
      const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, window.location.origin);
      const parts = url.pathname.split("/").filter(Boolean);
      const documentWrite = ["PATCH", "POST"].includes(method)
        && parts.length === 3
        && parts[0] === "api"
        && (parts[1] === "articles" || parts[1] === "people");
      try {
        const response = await originalFetch(...args);
        if (documentWrite) {
          setSaveFailed(!response.ok);
          if (response.ok) setRetrying(false);
        }
        return response;
      } catch (error) {
        if (documentWrite) {
          setSaveFailed(true);
          setRetrying(false);
        }
        throw error;
      }
    };
    window.fetch = trackFailure;
    const offline = () => { setOnline(false); setSaveFailed(true); };
    const backOnline = () => { setOnline(true); setRetrying(false); };
    window.addEventListener("offline", offline);
    window.addEventListener("online", backOnline);
    return () => {
      if (window.fetch === trackFailure) window.fetch = originalFetch;
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", backOnline);
    };
  }, []);

  function retry() {
    setRetrying(true);
    document.querySelector<HTMLFormElement>("form.collection-edit__form")?.requestSubmit();
  }

  const state = lockedBySomeoneElse
    ? lockedBy ? `Locked · ${lockedBy}` : "Locked"
    : saveFailed
      ? "Save failed"
      : processing || retrying
      ? "Saving"
      : pendingChanges
        ? "Unsaved"
        : "Saved";

  return (
    <div className="save-safety" role="status">
      <span>{state}</span>
      {saveFailed ? <button disabled={!online || retrying} onClick={retry} type="button">Retry</button> : null}
    </div>
  );
}
