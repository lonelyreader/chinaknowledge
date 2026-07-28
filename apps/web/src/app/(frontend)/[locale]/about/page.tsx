import Link from "next/link";

import { requireLocale } from "@/content";

const copy = {
  en: {
    body: "China, in Fact is an editorial publication built with people who know China closely. Stories, guides and places are reviewed, sourced and connected to the people behind them.",
    people: "Meet the people",
    title: "About China, in Fact",
  },
  es: {
    body: "China, in Fact es una publicación editorial creada con personas que conocen China de cerca. Historias, guías y lugares se revisan, se documentan y se conectan con quienes están detrás de ellos.",
    people: "Conoce a las personas",
    title: "Sobre China, in Fact",
  },
} as const;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return (
    <main className="newsletter-page page-shell">
      <p className="meta">China, in Fact</p>
      <h1>{copy[locale].title}</h1>
      <p>{copy[locale].body}</p>
      <Link className="button" href={`/${locale}/people`}>{copy[locale].people}</Link>
    </main>
  );
}
