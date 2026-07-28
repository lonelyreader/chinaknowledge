"use client";

import { Button, toast, useAuth, useDocumentInfo, useFormFields, useFormModified } from "@payloadcms/ui";
import { useState } from "react";

import type { User } from "@/payload-types";

function relationID(value: unknown) {
  if (value && typeof value === "object") {
    if ("value" in value) return (value as { value: unknown }).value;
    if ("id" in value) return (value as { id: unknown }).id;
  }
  return value;
}

export function TranslationActions() {
  const { user } = useAuth<User>();
  const { id } = useDocumentInfo();
  const modified = useFormModified();
  const locale = useFormFields<unknown>(([fields]) => fields.locale?.value);
  const owner = useFormFields<unknown>(([fields]) => fields.owner?.value);
  const [pending, setPending] = useState(false);

  if (!id || relationID(owner) !== user?.id) return null;
  const target = locale === "es" ? "English" : "Spanish";

  async function openTranslation() {
    setPending(true);
    try {
      const response = await fetch(`/api/articles/${id}/translation`, { method: "POST" });
      const data = await response.json() as { errors?: { message?: string }[]; url?: string };
      if (!response.ok || !data.url) throw new Error(data.errors?.[0]?.message ?? "Translation unavailable.");
      window.location.assign(data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Translation unavailable.");
      setPending(false);
    }
  }

  return (
    <div className="translation-actions">
      <Button
        buttonStyle="secondary"
        disabled={modified || pending}
        onClick={() => void openTranslation()}
        size="small"
      >{`Add ${target} version`}</Button>
    </div>
  );
}
