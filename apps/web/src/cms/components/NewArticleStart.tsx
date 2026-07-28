"use client";

import { toast } from "@payloadcms/ui";
import { FormEvent, useState } from "react";

export function NewArticleStart() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const locale = form.get("locale") === "es" ? "es" : "en";
    if (!title) return;
    setPending(true);
    try {
      const response = await fetch("/api/articles?draft=true", {
        body: JSON.stringify({ locale, title }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const article = await response.json() as { errors?: { message?: string }[]; id?: number | string };
      if (!response.ok || !article.id) throw new Error(article.errors?.[0]?.message ?? "Article could not be created.");
      window.location.assign(`/admin/collections/articles/${article.id}?mode=creator`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Article could not be created.");
      setPending(false);
    }
  }

  if (!open) {
    return <button className="btn btn--style-primary btn--size-small" onClick={() => setOpen(true)} type="button">New article</button>;
  }
  return (
    <form className="new-article-start" onSubmit={submit}>
      <label>Title<input autoFocus name="title" required /></label>
      <label>Language<select defaultValue="en" name="locale"><option value="en">English</option><option value="es">Spanish</option></select></label>
      <button className="btn btn--style-primary btn--size-small" disabled={pending} type="submit">Start</button>
      <button className="btn btn--style-secondary btn--size-small" disabled={pending} onClick={() => setOpen(false)} type="button">Cancel</button>
    </form>
  );
}
