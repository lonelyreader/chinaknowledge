"use client";

import { useAllFormFields, useDocumentInfo, useFormModified } from "@payloadcms/ui";
import { useEffect, useMemo, useRef, useState } from "react";

function fingerprint(fields: unknown) {
  if (!fields || typeof fields !== "object") return "";
  return JSON.stringify(
    Object.entries(fields as Record<string, { value?: unknown }>)
      .filter(([path]) => !["_status", "createdAt", "updatedAt"].includes(path))
      .map(([path, field]) => [path, field?.value]),
  );
}

export function usePendingFormChanges() {
  const [fields] = useAllFormFields();
  const modified = useFormModified();
  const { lastUpdateTime, mostRecentVersionIsAutosaved } = useDocumentInfo();
  const formFingerprint = useMemo(() => fingerprint(fields), [fields]);
  const mounted = useRef(false);
  const [latestInputAt, setLatestInputAt] = useState(0);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setLatestInputAt(Date.now());
  }, [formFingerprint]);

  if (!modified) return false;
  if (!mostRecentVersionIsAutosaved) return true;
  return lastUpdateTime < latestInputAt;
}
