import { NextResponse } from "next/server";

import { validateServerEnvironment, type ServerEnvironment } from "@/config/environment";
import { isLocale, type Locale } from "@/content";
import {
  createNewsletterClient,
  isNewsletterEmail,
  normalizeNewsletterEmail,
  subscribeNewsletterContact,
} from "@/lib/newsletter";

export const runtime = "nodejs";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

type NewsletterHandlerDependencies = {
  getEnvironment: () => Pick<ServerEnvironment, "newsletterEnabled">;
  subscribe: (input: { email: string; locale: Locale }) => Promise<void>;
};

export function createNewsletterPostHandler(dependencies: NewsletterHandlerDependencies) {
  return async function newsletterPost(request: Request) {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ status: "rejected" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }

    if (typeof body.website === "string" && body.website.length > 0) {
      return NextResponse.json({ status: "subscribed" });
    }

    const email = normalizeNewsletterEmail(typeof body.email === "string" ? body.email : "");
    const locale = typeof body.locale === "string" ? body.locale : "";
    if (!isNewsletterEmail(email) || !isLocale(locale) || body.consent !== true) {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }

    const environment = dependencies.getEnvironment();
    if (!environment.newsletterEnabled) {
      return NextResponse.json({ status: "unavailable" }, { status: 503 });
    }

    try {
      await dependencies.subscribe({ email, locale });
      return NextResponse.json({ status: "subscribed" });
    } catch (error) {
      console.error("Newsletter subscription failed.", error instanceof Error ? error.name : "unknown");
      return NextResponse.json({ status: "unavailable" }, { status: 502 });
    }
  };
}

export const POST = createNewsletterPostHandler({
  getEnvironment: validateServerEnvironment,
  subscribe: async ({ email, locale }) => {
    const resend = createNewsletterClient(process.env.RESEND_CONTACTS_API_KEY!);
    await subscribeNewsletterContact(resend, {
      email,
      locale,
      topicId: process.env.RESEND_NEWSLETTER_TOPIC_ID!,
    });
  },
});
