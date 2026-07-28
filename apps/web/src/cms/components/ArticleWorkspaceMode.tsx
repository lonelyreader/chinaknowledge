"use client";

import { useAuth, useFormFields } from "@payloadcms/ui";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { User } from "@/payload-types";

type Mode = "creator" | "curation";

function relationID(value: unknown) {
  if (value && typeof value === "object") {
    if ("value" in value) return (value as { value: unknown }).value;
    if ("id" in value) return (value as { id: unknown }).id;
  }
  return value;
}

export function ArticleWorkspaceMode() {
  const { user } = useAuth<User>();
  const searchParams = useSearchParams();
  const owner = useFormFields<unknown>(([fields]) => fields.owner?.value);
  const editorial = user?.role === "editor" || user?.role === "super_admin";
  const isOwner = !editorial || !relationID(owner) || String(relationID(owner)) === String(user?.id);
  const requested = searchParams.get("mode");
  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const mode = !isOwner
    ? "curation"
    : chosenMode ?? (requested === "curation" ? "curation" : "creator");

  useEffect(() => {
    document.documentElement.dataset.articleMode = mode;
    return () => { delete document.documentElement.dataset.articleMode; };
  }, [mode]);

  function choose(next: Mode) {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", next);
    window.history.replaceState(window.history.state, "", url);
    setChosenMode(next);
  }

  if (!editorial || !isOwner) return null;
  return (
    <div aria-label="Article workspace" className="article-workspace-mode" role="group">
      <button aria-pressed={mode === "creator"} onClick={() => choose("creator")} type="button">Writing</button>
      <button aria-pressed={mode === "curation"} onClick={() => choose("curation")} type="button">Site</button>
    </div>
  );
}
