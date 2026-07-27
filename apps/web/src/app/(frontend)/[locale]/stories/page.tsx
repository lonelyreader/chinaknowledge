import Link from "next/link";
import { localize, people, requireLocale, stories } from "@/content";

export default async function StoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  return (
    <main className="page-shell index-page">
      <header className="index-header"><p className="meta">{locale === "en" ? "Stories" : "Historias"}</p><h1>{locale === "en" ? "Reported, observed and lived" : "Relatos, observación y experiencia"}</h1></header>
      <div className="story-stream">
        {stories.filter((story) => story.kind === "Story").map((story) => {
          const author = people.find((person) => person.slug === story.authorSlug)!;
          return <article className="story-line" key={story.slug}><p className="meta">{story.date}</p><h2>{localize(story.title, locale)}</h2><Link href={`/${locale}/people/${author.slug}`}>{author.name}</Link></article>;
        })}
      </div>
    </main>
  );
}
