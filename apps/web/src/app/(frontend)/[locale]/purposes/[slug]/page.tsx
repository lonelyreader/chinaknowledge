import Link from "next/link";
import { notFound } from "next/navigation";

import { requireLocale, ui } from "@/content";
import { articlePath, cmsReadEnabled, getPublishedCMSArticlesByTaxonomy } from "@/content/cms";

export const dynamic = "force-dynamic";

const purposeSlugs = ["understand", "visit", "live", "study", "work", "business"] as const;

export default async function PurposePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  if (!cmsReadEnabled() || !purposeSlugs.includes(slug as (typeof purposeSlugs)[number])) notFound();
  const index = purposeSlugs.indexOf(slug as (typeof purposeSlugs)[number]);
  const articles = await getPublishedCMSArticlesByTaxonomy(locale, "purposes", slug);
  return (
    <main className="page-shell index-page">
      <header className="index-header"><p className="meta">{ui[locale].purpose[index]}</p><h1>{ui[locale].purpose[index]}</h1></header>
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
