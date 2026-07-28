import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CMSRichText } from "@/components/CMSRichText";
import { requireLocale, ui } from "@/content";
import { articlePath, cmsReadEnabled, getPublishedCMSArticle, resolvePublishedCMSArticle } from "@/content/cms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  if (!cmsReadEnabled()) return {};
  const article = await getPublishedCMSArticle(locale, slug);
  return article && article.format !== "guide"
    ? { title: article.title, description: article.summary }
    : {};
}

export default async function StoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  if (!cmsReadEnabled()) notFound();
  const resolution = await resolvePublishedCMSArticle(locale, slug);
  const article = resolution?.article;
  if (!article || article.format === "guide") notFound();
  if (resolution.canonicalSlug !== slug) redirect(articlePath(locale, article));
  const copy = ui[locale];

  return (
    <main>
      <article className="guide-page page-shell">
        <header className="guide-header">
          <p className="meta">{locale === "en" ? "Story" : "Historia"}{article.purposes[0] ? ` · ${article.purposes[0]}` : ""}</p>
          <h1>{article.title}</h1>
          <p className="dek">{article.summary}</p>
          <div className="guide-byline">
            <Image src={article.author.image.url} alt={article.author.image.alt} width={72} height={72} />
            <div>
              <span className="meta">{copy.writtenBy}</span>
              <Link href={`/${locale}/people/${article.author.slug}`}>{article.author.name}</Link>
              <span>{article.author.identity}, {article.author.city}</span>
            </div>
            <p>{article.publishedAt.slice(0, 10)}</p>
          </div>
        </header>
        <figure className="guide-image">
          <Image src={article.coverImage.url} alt={article.coverImage.alt} fill priority sizes="(max-width: 767px) 100vw, 1200px" />
        </figure>
        <div className="guide-body">
          <aside className="guide-aside"><p className="meta">{article.publishedAt.slice(0, 10)}</p></aside>
          <div className="prose">
            <CMSRichText data={article.body} />
            <section className="source-notes">
              <h2>{copy.sources}</h2>
              <ol>
                {article.sources.map((source) => (
                  <li key={`${source.label}-${source.url ?? "local"}`}>
                    {source.url ? <a href={source.url}>{source.label}</a> : source.label}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
        <section className="author-passage">
          <Image src={article.author.image.url} alt={article.author.image.alt} width={180} height={180} />
          <div>
            <p className="meta">{copy.aboutAuthor}</p>
            <h2>{article.author.name}</h2>
            <p>{article.author.introduction}</p>
            <Link className="text-link" href={`/${locale}/people/${article.author.slug}`}>{copy.contributions} →</Link>
          </div>
        </section>
      </article>
    </main>
  );
}
