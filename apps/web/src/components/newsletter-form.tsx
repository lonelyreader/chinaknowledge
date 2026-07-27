"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/content";
import { ui } from "@/content";

type Status = "idle" | "submitting" | "success" | "invalid" | "consent" | "error";

export function NewsletterForm({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState<Status>("idle");
  const copy = ui[locale];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("invalid");
      return;
    }
    if (data.get("consent") !== "on") {
      setStatus("consent");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/newsletter", {
        body: JSON.stringify({
          consent: true,
          email,
          locale,
          website: String(data.get("website") ?? ""),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
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
    <form className="newsletter-form" onSubmit={submit} noValidate aria-busy={status === "submitting"}>
      <label htmlFor={`email-${locale}`}>{copy.email}</label>
      <div className="newsletter-form__row">
        <input
          id={`email-${locale}`}
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={status === "invalid"}
          aria-describedby={status === "invalid" ? `email-error-${locale}` : undefined}
        />
        <button className="button" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? copy.joining : copy.join}
        </button>
      </div>
      <input className="newsletter-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <label className="newsletter-consent">
        <input
          name="consent"
          type="checkbox"
          aria-invalid={status === "consent"}
          aria-describedby={status === "consent" ? `consent-error-${locale}` : undefined}
        />
        <span>{copy.consent}</span>
      </label>
      <p className="newsletter-privacy">{copy.unsubscribe} <Link href={`/${locale}/privacy`}>{copy.privacy}</Link></p>
      {status === "invalid" ? <p className="form-error" id={`email-error-${locale}`} role="alert">{copy.invalidEmail}</p> : null}
      {status === "consent" ? <p className="form-error" id={`consent-error-${locale}`} role="alert">{copy.consentRequired}</p> : null}
      {status === "error" ? <p className="form-error" role="alert">{copy.newsletterError}</p> : null}
    </form>
  );
}
