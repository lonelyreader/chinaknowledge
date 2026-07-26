"use client";

import { FormEvent, useState } from "react";
import type { Locale } from "@/content";
import { ui } from "@/content";

type Status = "idle" | "success" | "error";

export function NewsletterForm({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<Status>("idle");
  const copy = ui[locale];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    setStatus(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="newsletter-result" role="status">
        <p>{copy.success}</p>
        <button className="text-button" type="button" onClick={() => setStatus("idle")}>← {copy.again}</button>
      </div>
    );
  }

  return (
    <form className="newsletter-form" onSubmit={submit} noValidate>
      <label htmlFor={`email-${locale}`}>{copy.email}</label>
      <div className="newsletter-form__row">
        <input
          id={`email-${locale}`}
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? `email-error-${locale}` : undefined}
        />
        <button className="button" type="submit">{copy.join}</button>
      </div>
      {status === "error" ? <p className="form-error" id={`email-error-${locale}`}>{copy.invalidEmail}</p> : null}
    </form>
  );
}
