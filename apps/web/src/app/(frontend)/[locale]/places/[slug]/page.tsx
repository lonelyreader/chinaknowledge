import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CMSPersonRow } from "@/components/cms-person-row";
import { ArticleBylineLink } from "@/components/article-byline";
import { requireLocale, ui } from "@/content";
import {
  articlePath,
  cmsReadEnabled,
  getPublishedCMSPlace,
  getPublishedCMSPlaces,
  placePath,
  resolvePublishedCMSPlace,
} from "@/content/cms";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  if (!cmsReadEnabled()) return {};
  const place = await getPublishedCMSPlace(locale, slug);
  if (!place) return {};
  const targetLocales = ["en", "es"] as const;
  const translations = await Promise.all(targetLocales.map(async (targetLocale) =>
    (await getPublishedCMSPlaces(targetLocale)).find((candidate) => candidate.translationGroup === place.translationGroup),
  ));
  const languages = Object.fromEntries(translations.flatMap((translation, index) =>
    translation ? [[targetLocales[index], placePath(targetLocales[index], translation)]] : [],
  ));
  return {
    alternates: { canonical: placePath(locale, place), languages },
    description: place.summary,
    title: place.name,
  };
}

export default async function PlacePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  if (!cmsReadEnabled()) notFound();
  const resolution = await resolvePublishedCMSPlace(locale, slug);
  if (!resolution) notFound();
  if (resolution.canonicalSlug !== slug) redirect(placePath(locale, resolution.place));
  const place = resolution.place;
  const copy = ui[locale];

  return (
    <main>
      <article className="guide-page page-shell">
        <header className="guide-header">
          <p className="meta">{locale === "en" ? "Place" : "Lugar"} · {place.geography.name}</p>
          <h1>{place.name}</h1>
          <p className="dek">{place.summary}</p>
        </header>
        <figure className="guide-image">
          <Image src={place.coverImage.url} alt={place.coverImage.alt} fill priority unoptimized sizes="(max-width: 767px) 100vw, 1200px" />
        </figure>
        <section className="place-related">
          <div className="section-heading"><h2>{locale === "en" ? "From this place" : "Desde este lugar"}</h2></div>
          <div className="story-stream">
            {place.articles.map((article) => (
              <article className="story-line" key={`${article.format}-${article.slug}`}>
                <p className="meta">{article.format === "guide" ? copy.guide : locale === "en" ? "Story" : "Historia"}<br />{article.publishedAt.slice(0, 10)}</p>
                <h3><Link href={articlePath(locale, article)}>{article.title}</Link></h3>
                <ArticleBylineLink author={article.author} locale={locale} />
              </article>
            ))}
          </div>
        </section>
      </article>
      {place.people.length ? (
        <section className="people-passage">
          <div className="page-shell">
            <div className="section-heading"><h2>{copy.people}</h2></div>
            <div className="people-passage__grid">
              {place.people.map((person) => <CMSPersonRow key={person.slug} person={person} locale={locale} />)}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
