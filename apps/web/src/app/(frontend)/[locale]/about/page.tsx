import Link from "next/link";

import { requireLocale } from "@/content";

const copy = {
  en: {
    body: "China, in Fact is a place to meet people in China through what they do, make and share. Stories, guides and places stay connected to the people behind them.",
    people: "Meet the people",
    title: "About China, in Fact",
  },
  es: {
    body: "China, in Fact es un lugar para conocer a personas en China a través de lo que hacen, crean y comparten. Las historias, guías y lugares siguen conectados con quienes están detrás de ellos.",
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
