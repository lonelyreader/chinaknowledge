import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";

import { CMSRichText } from "@/components/CMSRichText";
import { ArticleBylineLink, GuideArticleByline } from "@/components/article-byline";
import { EditorialCover } from "@/components/editorial-cover";
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
    title: article.seo.title || article.title,
    description: article.seo.description || article.summary || undefined,
    alternates: { canonical: articlePath(locale, article), languages },
    openGraph: {
      type: "article",
      title: article.seo.title || article.title,
      description: article.seo.description || article.summary || undefined,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: article.seo.image?.url || article.coverImage?.url
        ? [{ url: article.seo.image?.url || article.coverImage!.url, alt: article.seo.image?.alt || article.coverImage!.alt }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seo.title || article.title,
      description: article.seo.description || article.summary || undefined,
      images: article.seo.image?.url || article.coverImage?.url
        ? [article.seo.image?.url || article.coverImage!.url]
        : undefined,
    },
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
  const canonicalPath = articlePath(locale, article);
  const origin = (process.env.PAYLOAD_PUBLIC_SERVER_URL || "https://chinainfact.com").replace(/\/$/, "");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    author: article.author.kind === "person"
      ? { "@type": "Person", name: article.author.name, url: `${origin}/${locale}/people/${article.author.slug}` }
      : { "@type": "Organization", name: "China, in Fact", url: `${origin}/${locale}/about` },
    dateModified: article.updatedAt,
    datePublished: article.publishedAt,
    description: article.seo.description || article.summary || undefined,
    headline: article.seo.title || article.title,
    image: article.seo.image?.url || article.coverImage?.url || undefined,
    inLanguage: locale,
    mainEntityOfPage: `${origin}${canonicalPath}`,
    publisher: { "@type": "Organization", name: "China, in Fact", url: origin },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <article className="guide-page page-shell">
        <header className="guide-header">
          <p className="meta">{label}{siteSelected && article.purposes[0] ? ` · ${article.purposes[0]}` : ""}</p>
          <h1>{article.title}</h1>
          {article.summary ? <p className="dek">{article.summary}</p> : null}
          <GuideArticleByline
            author={article.author}
            locale={locale}
            label={copy.writtenBy}
            date={isGuide && article.freshnessDate ? <><span className="meta">{copy.reviewed}</span><br />{article.freshnessDate.slice(0, 10)}</> : article.publishedAt.slice(0, 10)}
          />
        </header>
        {article.coverImage ? (
          <figure className="guide-image">
            <Image src={article.coverImage.url} alt={article.coverImage.alt} fill priority unoptimized sizes="(max-width: 767px) 100vw, 1200px" />
          </figure>
        ) : <figure className="guide-image"><EditorialCover title={article.title} /></figure>}
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
        {article.author.kind === "person" ? (
          <section className="author-passage">
            <Image src={article.author.image.url} alt={article.author.image.alt} width={180} height={180} unoptimized />
            <div>
              <p className="meta">{copy.aboutAuthor}</p>
              <h2>{article.author.name}</h2>
              <p>{article.author.introduction}</p>
              <ArticleBylineLink className="text-link" author={article.author} locale={locale} />
            </div>
          </section>
        ) : article.relatedPeople.length ? (
          <section className="related-people-passage">
            <p className="meta">{copy.people}</p>
            <div className="story-stream">
              {article.relatedPeople.map((person) => (
                <article className="story-line" key={person.slug}>
                  <h2><Link href={`/${locale}/people/${person.slug}`}>{person.name}</Link></h2>
                  <span>{person.identity}, {person.city}</span>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
