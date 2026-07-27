import { Resend, type ErrorResponse } from "resend";

import type { Locale } from "@/content";

type NewsletterInput = {
  email: string;
  locale: Locale;
  topicId: string;
};

export class NewsletterProviderError extends Error {
  constructor(public readonly providerError: ErrorResponse) {
    super("Newsletter provider request failed.");
    this.name = "NewsletterProviderError";
  }
}

export function normalizeNewsletterEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isNewsletterEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function updateExistingContact(resend: Resend, input: NewsletterInput) {
  const contact = await resend.contacts.update({
    email: input.email,
    properties: { locale: input.locale },
  });
  if (contact.error) throw new NewsletterProviderError(contact.error);
}

export async function subscribeNewsletterContact(resend: Resend, input: NewsletterInput) {
  const existing = await resend.contacts.get(input.email);
  if (existing.data) {
    // Preserve provider-managed unsubscribe preferences. This public form has
    // no proof that the submitter owns an existing address.
    await updateExistingContact(resend, input);
    return;
  }
  if (existing.error.name !== "not_found" && existing.error.statusCode !== 404) {
    throw new NewsletterProviderError(existing.error);
  }

  const created = await resend.contacts.create({
    email: input.email,
    properties: { locale: input.locale },
    topics: [{ id: input.topicId, subscription: "opt_in" }],
    unsubscribed: false,
  });
  if (!created.error) return;

  if (created.error.statusCode === 409) {
    await updateExistingContact(resend, input);
    return;
  }
  throw new NewsletterProviderError(created.error);
}

export function createNewsletterClient(apiKey: string) {
  return new Resend(apiKey);
}
