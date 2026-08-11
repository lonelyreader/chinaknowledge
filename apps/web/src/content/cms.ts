import "server-only";

import { getPayload } from "payload";
import { cache } from "react";

import config from "@payload-config";
import type { Article, Media, Person, Place, Taxonomy } from "@/payload-types";
import { hasEditorialRole, isCMSUser } from "@/cms/roles";
import type { Locale } from "./types";
export { stableWeeklyPeople } from "./stable-weekly-people";

export type PublishedCMSImage = {
  alt: string;
  height: number | null;
  url: string;
  width: number | null;
};

export type PublishedCMSPerson = {
  city: string;
  contribution?: PublishedCMSArticleSummary;
  identity: string;
  image: PublishedCMSImage;
  introduction: string;
  languages: ("en" | "es")[];
  links: { label: string; type: string; url: string }[];
  name: string;
  slug: string;
  spotlightExcluded: boolean;
  spotlightPinnedUntil: string | null;
  topics: string[];
};

export type PublishedCMSByline =
  | ({ kind: "person" } & Omit<PublishedCMSPerson, "contribution">)
  | { kind: "site"; name: "China, in Fact" };

export type PublishedCMSArticleSummary = {
  authorSlug: string | null;
  authorshipType: "member" | "site";
  coverImage: PublishedCMSImage | null;
  curationStatus: Article["curationStatus"];
  format: Article["format"] | null;
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
  updatedAt: string;
};

export type PublishedCMSArticle = PublishedCMSArticleSummary & {
  author: PublishedCMSByline;
  body: NonNullable<Article["body"]>;
  relatedPeople: Omit<PublishedCMSPerson, "contribution">[];
  seo: { description: string | null; image: PublishedCMSImage | null; title: string | null };
  sources: { checkedAt: string | null; label: string; url?: string | null }[];
};

export type PublishedCMSGuide = PublishedCMSArticle;
export type CuratedCMSArticle = PublishedCMSArticle & {
  format: NonNullable<Article["format"]>;
};

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

function safeExternalURL(value: string, type?: string | null) {
  try {
    const url = new URL(value);
    if (type === "email") return url.protocol === "mailto:" ? url.toString() : null;
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function personBase(person: Person, locale: Locale): Omit<PublishedCMSPerson, "contribution"> | null {
  const image = publicImage(person.portrait);
  if (!image || !person.city || !person.identity || !person.introduction || !person.languages?.length || !person.slug) return null;
  return {
    city: locale === "es" ? person.cityEs || person.city : person.city,
    identity: locale === "es" ? person.identityEs || person.identity : person.identity,
    image,
    introduction: locale === "es" ? person.introductionEs || person.introduction : person.introduction,
    languages: person.languages,
    links: (person.links ?? []).flatMap((link) => {
      const type = link.type || "personal_site";
      const url = safeExternalURL(link.url, type);
      const label = locale === "es" ? link.labelEs || link.label : link.label;
      return url ? [{ label, type, url }] : [];
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
  const authorshipType = article.authorshipType === "site" ? "site" : "member";
  if (authorshipType === "member" && (!author || !author.slug)) return null;
  if (!article.publishedAt || !article.slug || !article.translationGroup || !article.title) return null;
  return {
    authorSlug: authorshipType === "member" ? author!.slug ?? null : null,
    authorshipType,
    coverImage,
    curationStatus: article.curationStatus,
    format: article.format ?? null,
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
    summary: article.summary ?? "",
    title: article.title,
    topics: taxonomyNames(article.topics),
    topicSlugs: taxonomySlugs(article.topics),
    translationGroup: article.translationGroup,
    updatedAt: article.updatedAt,
  };
}

function toPublishedArticle(article: Article): PublishedCMSArticle | null {
  if (!article.body) return null;
  const summary = articleSummary(article);
  const memberAuthor = article.author && typeof article.author === "object"
    ? personBase(article.author, article.locale)
    : null;
  const author: PublishedCMSByline | null = summary?.authorshipType === "site"
    ? { kind: "site", name: "China, in Fact" }
    : memberAuthor ? { ...memberAuthor, kind: "person" } : null;
  if (!summary || !author) return null;
  return {
    ...summary,
    author,
    body: article.body,
    relatedPeople: (article.relatedPeople ?? []).flatMap((person) => {
      if (typeof person !== "object") return [];
      const related = personBase(person, article.locale);
      return related ? [related] : [];
    }),
    seo: {
      description: article.seo?.description ?? null,
      image: publicImage(article.seo?.image),
      title: article.seo?.title ?? null,
    },
    sources: (article.sourceNotes ?? []).map((source) => ({
      checkedAt: source.checkedAt ?? null,
      label: source.label,
      url: source.url ? safeExternalURL(source.url) : null,
    })),
  };
}

export async function getDraftPreviewCMSArticle(
  locale: Locale,
  id: number | string,
  requestHeaders: Headers,
) {
  if (!cmsReadEnabled()) return null;
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: requestHeaders });
  if (!isCMSUser(user)) return null;
  // INFRA-BODY-MEDIA-002 (F1): read as the authenticated user instead of
  // overrideAccess so populated relations (body media included) go through
  // normal access control; access failures degrade to "no preview".
  try {
    const current = await payload.findByID({
      collection: "articles",
      depth: 2,
      id,
      overrideAccess: false,
      user,
    });
    const ownerID = typeof current.owner === "object" ? current.owner.id : current.owner;
    if (ownerID !== user.id && !hasEditorialRole(user)) return null;
    const versions = await payload.findVersions({
      collection: "articles",
      depth: 2,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      sort: "-updatedAt",
      user,
      where: {
        and: [
          { parent: { equals: id } },
          { latest: { equals: true } },
          { autosave: { equals: true } },
        ],
      },
    });
    const draft = versions.docs[0]?.version ?? current;
    if (draft.locale !== locale) return null;
    return toPublishedArticle({
      ...draft,
      publishedAt: draft.publishedAt ?? draft.updatedAt,
    });
  } catch {
    return null;
  }
}

const findMemberPublishedArticles = cache(async (locale: Locale) => {
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

const findCuratedArticles = cache(async (locale: Locale) => {
  if (!cmsReadEnabled()) return [];
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "articles",
      depth: 2,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      sort: "-publishedAt",
      where: {
        and: [
          { locale: { equals: locale } },
          { publicationStatus: { equals: "published" } },
          { curationStatus: { equals: "curated" } },
          { _status: { equals: "published" } },
          { publishedAt: { exists: true } },
        ],
      },
  });
  return result.docs.flatMap((article) => {
    const published = toPublishedArticle(article);
    if (!published?.format) return [];
    if (published.authorshipType === "member" && !published.coverImage) return [];
    return [published as CuratedCMSArticle];
  });
});

export async function resolvePublishedCMSArticle(locale: Locale, slug: string) {
  const articles = await findMemberPublishedArticles(locale);
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

export async function getPublishedCMSArticleAlternates(article: Pick<PublishedCMSArticleSummary, "translationGroup">) {
  const locales: Locale[] = ["en", "es"];
  const entries = await Promise.all(locales.map(async (locale) => {
    const alternate = (await findMemberPublishedArticles(locale))
      .find((candidate) => candidate.translationGroup === article.translationGroup);
    return alternate ? [locale, articlePath(locale, alternate)] as const : null;
  }));
  return Object.fromEntries(entries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)));
}

export async function getPublishedCMSArticleIndex(locale: Locale) {
  return findMemberPublishedArticles(locale);
}

export async function getPublishedCMSGuide(locale: Locale, slug: string) {
  const article = await getPublishedCMSArticle(locale, slug);
  return article?.format === "guide" ? article : null;
}

export async function getPublishedCMSGuides(locale: Locale) {
  return (await findCuratedArticles(locale)).filter((article) => article.format === "guide");
}

export async function getPublishedCMSStories(locale: Locale) {
  return (await findCuratedArticles(locale)).filter((article) => article.format !== "guide");
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
  const articles = await findCuratedArticles(locale);
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
      overrideAccess: true,
      pagination: false,
      sort: "name",
      where: {
        and: [
          { languages: { contains: locale } },
          { portrait: { exists: true } },
          { profilePublishedAt: { exists: true } },
          { profileStatus: { equals: "public" } },
        ],
      },
    }),
    findCuratedArticles(locale),
  ]);

  return peopleResult.docs.flatMap((person) => {
    const base = personBase(person, locale);
    const contribution = articles.find((article) => article.authorSlug === person.slug);
    return base ? [{ ...base, ...(contribution ? { contribution } : {}) }] : [];
  });
}

export async function getPublishedCMSHomepagePeople(locale: Locale) {
  return (await getPublishedCMSPeople(locale)).flatMap((person) =>
    person.contribution ? [{ ...person, contribution: person.contribution }] : [],
  );
}

export async function getPreviewCMSPerson(
  locale: Locale,
  id: number | string,
  requestHeaders: Headers,
) {
  if (!cmsReadEnabled()) return null;
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: requestHeaders });
  if (!isCMSUser(user)) return null;
  const person = await payload.findByID({
    collection: "people",
    depth: 2,
    id,
    overrideAccess: true,
  });
  const ownerID = person.user && typeof person.user === "object" ? person.user.id : person.user;
  if (ownerID !== user.id && !hasEditorialRole(user)) return null;
  if (!person.languages?.includes(locale)) return null;
  const base = personBase(person, locale);
  if (!base) return null;
  const contribution = (await findCuratedArticles(locale))
    .find((article) => article.authorSlug === person.slug);
  return { ...base, ...(contribution ? { contribution } : {}) };
}

export async function getPublishedCMSPerson(locale: Locale, slug: string) {
  const people = await getPublishedCMSPeople(locale);
  return people.find((person) => person.slug === slug) ?? null;
}

export async function getPublishedCMSPersonArticles(locale: Locale, slug: string) {
  return (await findMemberPublishedArticles(locale)).filter((article) => article.authorSlug === slug);
}

export async function getPublishedCMSArticlesByTaxonomy(
  locale: Locale,
  dimension: "purposes" | "topics",
  slug: string,
) {
  const slugField = dimension === "purposes" ? "purposeSlugs" : "topicSlugs";
  return (await findCuratedArticles(locale)).filter((article) =>
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
      findCuratedArticles(locale),
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
  return `/${locale}/posts/${article.slug}`;
}

export function placePath(locale: Locale, place: Pick<PublishedCMSPlace, "slug">) {
  return `/${locale}/places/${place.slug}`;
}
