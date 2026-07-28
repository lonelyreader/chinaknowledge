import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";

import { CMSRichText } from "@/components/CMSRichText";
import { requireLocale, ui } from "@/content";
import { articlePath, cmsReadEnabled, getDraftPreviewCMSArticle, getPublishedCMSArticle, getPublishedCMSArticleAlternates, resolvePublishedCMSArticle } from "@/content/cms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ preview?: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const { preview } = await searchParams;
  const locale = requireLocale(rawLocale);
  if (!cmsReadEnabled()) return {};
  if (preview) return { robots: { follow: false, index: false } };
  const article = await getPublishedCMSArticle(locale, slug);
  if (!article) return {};
  const languages = await getPublishedCMSArticleAlternates(article);
  return {
    title: article.title,
    description: article.summary || undefined,
    alternates: { canonical: articlePath(locale, article), languages },
  };
}

export default async function PostPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const { preview } = await searchParams;
  const locale = requireLocale(rawLocale);
  if (!cmsReadEnabled()) notFound();
  const previewRequested = Boolean(preview && /^\d+$/.test(preview));
  const previewArticle = previewRequested
    ? await getDraftPreviewCMSArticle(locale, preview!, new Headers(await headers()))
    : null;
  if (previewRequested && !previewArticle) notFound();
  const resolution = previewRequested ? null : await resolvePublishedCMSArticle(locale, slug);
  const article = previewArticle ?? resolution?.article;
  if (!article) notFound();
  if (resolution && resolution.canonicalSlug !== slug) permanentRedirect(articlePath(locale, article));
  const copy = ui[locale];
  const isGuide = article.format === "guide";
  const siteSelected = article.curationStatus === "curated";
  const label = siteSelected
    ? (isGuide ? copy.guide : locale === "en" ? "Story" : "Historia")
    : (locale === "en" ? "Post" : "Publicación");

  return (
    <main>
      <article className="guide-page page-shell">
        <header className="guide-header">
          <p className="meta">{label}{siteSelected && article.purposes[0] ? ` · ${article.purposes[0]}` : ""}</p>
          <h1>{article.title}</h1>
          {article.summary ? <p className="dek">{article.summary}</p> : null}
          <div className="guide-byline">
            <Image src={article.author.image.url} alt={article.author.image.alt} width={72} height={72} unoptimized />
            <div>
              <span className="meta">{copy.writtenBy}</span>
              <Link href={`/${locale}/people/${article.author.slug}`}>{article.author.name}</Link>
              <span>{article.author.identity}, {article.author.city}</span>
            </div>
            <p>
              {isGuide && article.freshnessDate ? <><span className="meta">{copy.reviewed}</span><br />{article.freshnessDate.slice(0, 10)}</> : article.publishedAt.slice(0, 10)}
            </p>
          </div>
        </header>
        {article.coverImage ? (
          <figure className="guide-image">
            <Image src={article.coverImage.url} alt={article.coverImage.alt} fill priority unoptimized sizes="(max-width: 767px) 100vw, 1200px" />
          </figure>
        ) : null}
        <div className="guide-body">
          <aside className="guide-aside"><p className="meta">{article.publishedAt.slice(0, 10)}</p></aside>
          <div className="prose">
            <CMSRichText data={article.body} />
            {article.sources.length ? (
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
            ) : null}
          </div>
        </div>
        <section className="author-passage">
          <Image src={article.author.image.url} alt={article.author.image.alt} width={180} height={180} unoptimized />
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
