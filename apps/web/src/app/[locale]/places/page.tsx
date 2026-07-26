import Link from "next/link";
import { localize, people, requireLocale, stories } from "@/content";

export default async function PlacesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  const placeStory = stories.find((story) => story.kind === "Place")!;
  const author = people.find((person) => person.slug === placeStory.authorSlug)!;
  return (
    <main className="page-shell index-page">
      <header className="index-header"><p className="meta">{locale === "en" ? "Places" : "Lugares"}</p><h1>{locale === "en" ? "Places, through daily attention" : "Lugares, desde la atención cotidiana"}</h1></header>
      <article className="index-lead"><p className="meta">Wuhan · {placeStory.date}</p><h2>{localize(placeStory.title, locale)}</h2><p>{localize(placeStory.summary, locale)}</p><Link className="text-link" href={`/${locale}/people/${author.slug}`}>{author.name}</Link></article>
    </main>
  );
}
