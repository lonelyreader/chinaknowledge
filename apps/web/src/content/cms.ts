import "server-only";

import { getPayload } from "payload";
import { cache } from "react";

import config from "@payload-config";
import type { Article, Media, Person, Place, Taxonomy } from "@/payload-types";
import type { Locale } from "./types";

export type PublishedCMSImage = {
  alt: string;
  height: number | null;
  url: string;
  width: number | null;
};

export type PublishedCMSPerson = {
  city: string;
  contribution: PublishedCMSArticleSummary;
  identity: string;
  image: PublishedCMSImage;
  introduction: string;
  languages: ("en" | "es")[];
  links: { label: string; url: string }[];
  name: string;
  slug: string;
  spotlightExcluded: boolean;
  spotlightPinnedUntil: string | null;
  topics: string[];
};

export type PublishedCMSArticleSummary = {
  authorSlug: string;
  coverImage: PublishedCMSImage;
  format: Article["format"];
  freshnessDate: string | null;
  geographies: string[];
  geographySlugs: string[];
  homepageEndsAt: string | null;
  homepagePlacement: "none" | "lead" | "selected";
  homepageStartsAt: string | null;
  publishedAt: string;
  purposes: string[];
  purposeSlugs: string[];
  situations: string[];
  slug: string;
  summary: string;
  title: string;
  topics: string[];
  topicSlugs: string[];
  translationGroup: string;
};

export type PublishedCMSArticle = PublishedCMSArticleSummary & {
  author: Omit<PublishedCMSPerson, "contribution">;
  body: NonNullable<Article["body"]>;
  sources: { label: string; url?: string | null }[];
};

export type PublishedCMSGuide = PublishedCMSArticle;

export type PublishedCMSPlace = {
  articles: PublishedCMSArticle[];
  coverImage: PublishedCMSImage;
  geography: { name: string; slug: string };
  name: string;
  people: PublishedCMSPerson[];
  publishedAt: string;
  slug: string;
  summary: string;
  translationGroup: string;
};

export function cmsReadEnabled() {
  return process.env.CMS_READ_MODE === "cms";
}

function taxonomyNames(values: (number | Taxonomy)[] | null | undefined) {
  return (values ?? []).flatMap((value) =>
    typeof value === "object" && value.name ? [value.name] : [],
  );
}

function taxonomySlugs(values: (number | Taxonomy)[] | null | undefined) {
  return (values ?? []).flatMap((value) =>
    typeof value === "object" && value.slug ? [value.slug] : [],
  );
}

function publicImage(value: number | Media | null | undefined): PublishedCMSImage | null {
  if (!value || typeof value !== "object" || !value.url) return null;
  return {
    alt: value.alt,
    height: value.height ?? null,
    url: value.url,
    width: value.width ?? null,
  };
}

function safeExternalURL(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function personBase(person: Person): Omit<PublishedCMSPerson, "contribution"> | null {
  const image = publicImage(person.portrait);
  if (!image) return null;
  return {
    city: person.city,
    identity: person.identity,
    image,
    introduction: person.introduction,
    languages: person.languages,
    links: (person.links ?? []).flatMap((link) => {
      const url = safeExternalURL(link.url);
      return url ? [{ label: link.label, url }] : [];
    }),
    name: person.name,
    slug: person.slug,
    spotlightExcluded: person.spotlightExcluded ?? false,
    spotlightPinnedUntil: person.spotlightPinnedUntil ?? null,
    topics: taxonomyNames(person.topics),
  };
}

function articleSummary(article: Article): PublishedCMSArticleSummary | null {
  const coverImage = publicImage(article.coverImage);
  const author = typeof article.author === "object" ? article.author : null;
  if (!coverImage || !author || !article.publishedAt) return null;
  return {
    authorSlug: author.slug,
    coverImage,
    format: article.format,
    freshnessDate: article.freshnessDate ?? null,
    geographies: taxonomyNames(article.geographies),
    geographySlugs: taxonomySlugs(article.geographies),
    homepageEndsAt: article.homepageEndsAt ?? null,
    homepagePlacement: article.homepagePlacement ?? "none",
    homepageStartsAt: article.homepageStartsAt ?? null,
    publishedAt: article.publishedAt,
    purposes: taxonomyNames(article.purposes),
    purposeSlugs: taxonomySlugs(article.purposes),
    situations: taxonomyNames(article.situations),
    slug: article.slug,
    summary: article.summary,
    title: article.title,
    topics: taxonomyNames(article.topics),
    topicSlugs: taxonomySlugs(article.topics),
    translationGroup: article.translationGroup,
  };
}

function toPublishedArticle(article: Article): PublishedCMSArticle | null {
  if (!article.body || typeof article.author !== "object") return null;
  const summary = articleSummary(article);
  const author = personBase(article.author);
  if (!summary || !author) return null;
  return {
    ...summary,
    author,
    body: article.body,
    sources: (article.sourceNotes ?? []).map((source) => ({
      label: source.label,
      url: source.url ? safeExternalURL(source.url) : null,
    })),
  };
}

const findPublishedArticles = cache(async (locale: Locale) => {
  if (!cmsReadEnabled()) return [];
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "articles",
    depth: 2,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    sort: "-publishedAt",
    where: { locale: { equals: locale } },
  });
  return result.docs.flatMap((article) => {
    const published = toPublishedArticle(article);
    return published ? [published] : [];
  });
});

export async function resolvePublishedCMSArticle(locale: Locale, slug: string) {
  const articles = await findPublishedArticles(locale);
  const direct = articles.find((article) => article.slug === slug);
  if (direct) return { article: direct, canonicalSlug: direct.slug };
  if (!cmsReadEnabled()) return null;

  const payload = await getPayload({ config });
  const sourceResult = await payload.find({
    collection: "articles",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  });
  const source = sourceResult.docs[0];
  if (!source) return null;
  const alternate = articles.find((article) => article.translationGroup === source.translationGroup);
  if (!alternate) {
    const alternateResult = await payload.find({
      collection: "articles",
      depth: 2,
      limit: 1,
      overrideAccess: false,
      where: {
        and: [
          { locale: { equals: locale } },
          { translationGroup: { equals: source.translationGroup } },
        ],
      },
    });
    const resolved = alternateResult.docs[0] ? toPublishedArticle(alternateResult.docs[0]) : null;
    return resolved ? { article: resolved, canonicalSlug: resolved.slug } : null;
  }
  return { article: alternate, canonicalSlug: alternate.slug };
}

export async function getPublishedCMSArticle(locale: Locale, slug: string) {
  return (await resolvePublishedCMSArticle(locale, slug))?.article ?? null;
}

export async function getPublishedCMSGuide(locale: Locale, slug: string) {
  const article = await getPublishedCMSArticle(locale, slug);
  return article?.format === "guide" ? article : null;
}

export async function getPublishedCMSGuides(locale: Locale) {
  return (await findPublishedArticles(locale)).filter((article) => article.format === "guide");
}

export async function getPublishedCMSStories(locale: Locale) {
  return (await findPublishedArticles(locale)).filter((article) => article.format !== "guide");
}

function curationIsActive(article: PublishedCMSArticleSummary, now: number) {
  const startsAt = article.homepageStartsAt ? new Date(article.homepageStartsAt).getTime() : -Infinity;
  const endsAt = article.homepageEndsAt ? new Date(article.homepageEndsAt).getTime() : Infinity;
  return startsAt <= now && now < endsAt;
}

function weeklyScore(week: number, slug: string) {
  return Array.from(`${week}:${slug}`).reduce(
    (value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0,
    7,
  );
}

function currentUTCWeek(now = new Date()) {
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  return Math.floor((now.getTime() - start) / 604_800_000);
}

export async function getPublishedCMSHomepage(locale: Locale) {
  const articles = await findPublishedArticles(locale);
  const now = Date.now();
  const active = articles.filter((article) => curationIsActive(article, now));
  const leads = active
    .filter((article) => article.homepagePlacement === "lead")
    .sort((left, right) => (right.homepageStartsAt ?? "").localeCompare(left.homepageStartsAt ?? ""));
  const lead = leads[0] ?? articles[0] ?? null;
  const week = currentUTCWeek();
  const pool = active
    .filter((article) => article.homepagePlacement === "selected" && article.slug !== lead?.slug)
    .sort((left, right) => weeklyScore(week, left.slug) - weeklyScore(week, right.slug));
  const fallback = articles.filter((article) => article.slug !== lead?.slug && !pool.some((item) => item.slug === article.slug));
  return { articles, lead, selected: [...pool, ...fallback].slice(0, 3) };
}

export async function getPublishedCMSPeople(locale: Locale) {
  if (!cmsReadEnabled()) return [];
  const payload = await getPayload({ config });
  const [peopleResult, articles] = await Promise.all([
    payload.find({
      collection: "people",
      depth: 2,
      limit: 200,
      overrideAccess: false,
      pagination: false,
      sort: "name",
      where: { languages: { contains: locale } },
    }),
    findPublishedArticles(locale),
  ]);

  return peopleResult.docs.flatMap((person) => {
    const base = personBase(person);
    const contribution = articles.find((article) => article.authorSlug === person.slug);
    return base && contribution ? [{ ...base, contribution }] : [];
  });
}

export async function getPublishedCMSPerson(locale: Locale, slug: string) {
  const people = await getPublishedCMSPeople(locale);
  return people.find((person) => person.slug === slug) ?? null;
}

export async function getPublishedCMSPersonArticles(locale: Locale, slug: string) {
  return (await findPublishedArticles(locale)).filter((article) => article.authorSlug === slug);
}

export async function getPublishedCMSArticlesByTaxonomy(
  locale: Locale,
  dimension: "purposes" | "topics",
  slug: string,
) {
  const slugField = dimension === "purposes" ? "purposeSlugs" : "topicSlugs";
  return (await findPublishedArticles(locale)).filter((article) =>
    article[slugField].includes(slug),
  );
}

const findPublishedPlaces = cache(async (locale: Locale) => {
  if (!cmsReadEnabled()) return [];
  const payload = await getPayload({ config });
  const [placesResult, articles, people] = await Promise.all([
    payload.find({
      collection: "places",
      depth: 2,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: "name",
      where: { locale: { equals: locale } },
    }),
    findPublishedArticles(locale),
    getPublishedCMSPeople(locale),
  ]);

  return placesResult.docs.flatMap((place: Place) => {
    const coverImage = publicImage(place.coverImage);
    const geography = typeof place.geography === "object" ? place.geography : null;
    if (!coverImage || !geography || !place.publishedAt) return [];
    const relatedArticles = articles.filter((article) =>
      article.geographySlugs.includes(geography.slug),
    );
    if (!relatedArticles.length) return [];
    const relatedPeople = people.flatMap((person) => {
      const contribution = relatedArticles.find((article) => article.authorSlug === person.slug);
      return contribution ? [{ ...person, contribution }] : [];
    });
    return [{
      articles: relatedArticles,
      coverImage,
      geography: { name: geography.name, slug: geography.slug },
      name: place.name,
      people: relatedPeople,
      publishedAt: place.publishedAt,
      slug: place.slug,
      summary: place.summary,
      translationGroup: place.translationGroup,
    } satisfies PublishedCMSPlace];
  });
});

export async function getPublishedCMSPlaces(locale: Locale) {
  return findPublishedPlaces(locale);
}

export async function resolvePublishedCMSPlace(locale: Locale, slug: string) {
  const places = await findPublishedPlaces(locale);
  const direct = places.find((place) => place.slug === slug);
  if (direct) return { canonicalSlug: direct.slug, place: direct };
  if (!cmsReadEnabled()) return null;

  const payload = await getPayload({ config });
  const sourceResult = await payload.find({
    collection: "places",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  });
  const source = sourceResult.docs[0];
  if (!source) return null;
  const alternate = places.find((place) => place.translationGroup === source.translationGroup);
  return alternate ? { canonicalSlug: alternate.slug, place: alternate } : null;
}

export async function getPublishedCMSPlace(locale: Locale, slug: string) {
  return (await resolvePublishedCMSPlace(locale, slug))?.place ?? null;
}

export function articlePath(locale: Locale, article: PublishedCMSArticleSummary) {
  return `/${locale}/${article.format === "guide" ? "guides" : "stories"}/${article.slug}`;
}

export function placePath(locale: Locale, place: Pick<PublishedCMSPlace, "slug">) {
  return `/${locale}/places/${place.slug}`;
}

export function stableWeeklyPeople<T extends { slug: string; spotlightExcluded?: boolean; spotlightPinnedUntil?: string | null }>(items: T[], count: number) {
  const now = new Date();
  const week = currentUTCWeek(now);
  const eligible = items.filter((item) => !item.spotlightExcluded);
  const pinned = eligible
    .filter((item) => item.spotlightPinnedUntil && new Date(item.spotlightPinnedUntil).getTime() > now.getTime())
    .sort((left, right) => (right.spotlightPinnedUntil ?? "").localeCompare(left.spotlightPinnedUntil ?? ""))
    .slice(0, 1);
  const pinnedSlugs = new Set(pinned.map((item) => item.slug));
  const rotationPool = eligible.filter((item) => !pinnedSlugs.has(item.slug));
  const previous = new Set(
    [...rotationPool]
      .sort((left, right) => weeklyScore(week - 1, left.slug) - weeklyScore(week - 1, right.slug))
      .slice(0, count)
      .map((item) => item.slug),
  );
  const candidates = rotationPool.length >= count * 2
    ? rotationPool.filter((item) => !previous.has(item.slug))
    : rotationPool;
  const rotated = [...candidates]
    .sort((left, right) => weeklyScore(week, left.slug) - weeklyScore(week, right.slug));
  return [...pinned, ...rotated].slice(0, count);
}
