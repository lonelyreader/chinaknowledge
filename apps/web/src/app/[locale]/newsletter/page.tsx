import { NewsletterForm } from "@/components/newsletter-form";
import { requireLocale, ui } from "@/content";

export default async function NewsletterPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  const copy = ui[locale];
  return (
    <main className="newsletter-page page-shell">
      <p className="meta">Newsletter</p>
      <h1>{copy.newsletter}</h1>
      <NewsletterForm locale={locale} />
    </main>
  );
}
