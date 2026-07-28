"use client";

import { Button, toast, useAuth, useDocumentInfo, useFormFields, useFormModified } from "@payloadcms/ui";
import { useEffect, useState } from "react";

import type { Article, User } from "@/payload-types";

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
  const [owner, setOwner] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!id || !user?.id) return;
    let current = true;
    void fetch(`/api/articles/${id}?depth=0&draft=true`)
      .then(async (response) => response.ok ? response.json() as Promise<Article> : null)
      .then((article) => {
        if (current) setOwner(String(relationID(article?.owner)) === String(user.id));
      });
    return () => { current = false; };
  }, [id, user?.id]);

  if (!id || !owner) return null;
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
