import Link from "next/link";
import { notFound } from "next/navigation";

import { requireLocale } from "@/content";
import { articlePath, cmsReadEnabled, getPublishedCMSArticlesByTaxonomy } from "@/content/cms";

export const dynamic = "force-dynamic";

export default async function TopicPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  if (!cmsReadEnabled()) notFound();
  const articles = await getPublishedCMSArticlesByTaxonomy(locale, "topics", slug);
  if (!articles.length) notFound();
  const first = articles[0];
  const topicIndex = first.topicSlugs.indexOf(slug);
  const label = first.topics[topicIndex] ?? slug;
  return (
    <main className="page-shell index-page">
      <header className="index-header"><p className="meta">{locale === "en" ? "Topic" : "Tema"}</p><h1>{label}</h1></header>
      <div className="story-stream">
        {articles.map((article) => (
          <article className="story-line" key={`${article.format}-${article.slug}`}>
            <p className="meta">{article.publishedAt.slice(0, 10)}</p>
            <h2><Link href={articlePath(locale, article)}>{article.title}</Link></h2>
            <Link href={`/${locale}/people/${article.author.slug}`}>{article.author.name}</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
