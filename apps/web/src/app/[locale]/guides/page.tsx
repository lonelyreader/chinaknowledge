import Link from "next/link";
import { drivingGuide, localize, requireLocale, ui } from "@/content";

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  const copy = ui[locale];
  return (
    <main className="page-shell index-page">
      <header className="index-header">
        <p className="meta">{copy.nav[1]}</p>
        <h1>{locale === "en" ? "Useful knowledge, kept current" : "Conocimiento útil, al día"}</h1>
      </header>
      <article className="index-lead">
        <p className="meta">{copy.reviewed} · {drivingGuide.reviewed}</p>
        <h2><Link href={`/${locale}/guides/${drivingGuide.slug}`}>{localize(drivingGuide.title, locale)}</Link></h2>
        <p>{localize(drivingGuide.summary, locale)}</p>
      </article>
    </main>
  );
}
