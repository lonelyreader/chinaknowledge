import Link from "next/link";
import { ArticleBylineLink } from "@/components/article-byline";
import { localize, people, requireLocale, stories } from "@/content";
import { articlePath, cmsReadEnabled, getPublishedCMSStories } from "@/content/cms";

export const dynamic = "force-dynamic";

export default async function StoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  if (cmsReadEnabled()) {
    const cmsStories = await getPublishedCMSStories(locale);
    return (
      <main className="page-shell index-page">
        <header className="index-header"><p className="meta">{locale === "en" ? "Stories" : "Historias"}</p><h1>{locale === "en" ? "Reported, observed and lived" : "Relatos, observación y experiencia"}</h1></header>
        <div className="story-stream">
          {cmsStories.map((story) => (
            <article className="story-line" key={story.slug}>
              <p className="meta">{story.publishedAt.slice(0, 10)}</p>
              <h2><Link href={articlePath(locale, story)}>{story.title}</Link></h2>
              <ArticleBylineLink author={story.author} locale={locale} />
            </article>
          ))}
        </div>
      </main>
    );
  }
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
