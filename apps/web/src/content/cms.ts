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
  /** Plain-text third-person editorial biography (byline/author-card shape). */
  bioThirdPerson?: string;
  canHelpWith: string[];
  city: string;
  contribution?: PublishedCMSArticleSummary;
  /** Member-owned Discord contact line; absent without a discord link. */
  discordLine?: string;
  /** Localized richText editorial biography for the person page renderer. */
  editorialBio: Person["editorialBio"] | null;
  /** Localized editorial epithet (roster line, byline, OG description). */
  epithet?: string;
  /** Member's hanzi name for the seal/signature system. */
  hanziName?: string;
  identity: string;
  image: PublishedCMSImage;
  introduction: string;
  languages: ("en" | "es")[];
  links: { label: string; type: string; url: string }[];
  name: string;
  quote: string | null;
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

function richTextNodeHasContent(node: { children?: unknown; text?: unknown; type?: unknown }): boolean {
  if (typeof node.text === "string" && node.text.trim()) return true;
  if (node.type === "upload" || node.type === "block") return true;
  return Array.isArray(node.children)
    && node.children.some((child) => child && typeof child === "object" && richTextNodeHasContent(child));
}

function publicRichTextNode(node: unknown): unknown | null {
  if (!node || typeof node !== "object" || Array.isArray(node)) return node;
  const value = node as Record<string, unknown>;
  if (value.type === "upload") {
    if (value.relationTo !== "media") return null;
    const media = value.value;
    if (!media || typeof media !== "object") return null;
    const document = media as Media;
    if (!document.memberUsePublishedAt && !document.publicUseApprovedAt) return null;
    const image = publicImage(document);
    if (!image) return null;
    const fields = value.fields && typeof value.fields === "object"
      ? value.fields as Record<string, unknown>
      : null;
    return {
      ...(fields && typeof fields.caption === "string" ? { fields: { caption: fields.caption } } : {}),
      relationTo: "media",
      type: "upload",
      value: { id: document.id, ...image },
    };
  }
  if (value.type === "text") {
    return typeof value.text === "string"
      ? { ...(typeof value.format === "number" ? { format: value.format } : {}), text: value.text, type: "text" }
      : null;
  }
  if (value.type === "linebreak") return { type: "linebreak" };
  const children = Array.isArray(value.children)
    ? value.children.flatMap((child) => {
      const publicChild = publicRichTextNode(child);
      return publicChild == null ? [] : [publicChild];
    })
    : [];
  if (["root", "paragraph", "quote", "listitem"].includes(String(value.type))) {
    return { children, type: value.type };
  }
  if (value.type === "heading") {
    return { children, tag: value.tag === "h3" || value.tag === "h4" ? value.tag : "h2", type: "heading" };
  }
  if (value.type === "list") {
    return { children, listType: value.listType === "number" ? "number" : "bullet", type: "list" };
  }
  if (value.type === "link" || value.type === "autolink") {
    return { children, ...(typeof value.url === "string" ? { url: value.url } : {}), type: value.type };
  }
  return null;
}

function publicRichText(value: Person["editorialBio"]) {
  if (!value?.root) return null;
  const root = publicRichTextNode(value.root);
  return root && typeof root === "object"
    ? { ...value, root } as Person["editorialBio"]
    : null;
}

// Localized richText with the site-wide "es falls back to en" rule; empty
// documents (an empty root produced by touching the editor) count as missing.
function localizedRichText(
  en: Person["editorialBio"],
  es: Person["editorialBio"],
  locale: Locale,
  publicOnly: boolean,
) {
  const candidates = locale === "es" ? [es, en] : [en];
  for (const candidate of candidates) {
    const value = publicOnly ? publicRichText(candidate) : candidate;
    if (value?.root && richTextNodeHasContent(value.root)) return value;
  }
  return null;
}

function localizedLine(en: string | null | undefined, es: string | null | undefined, locale: Locale) {
  const enValue = en?.trim() || null;
  if (locale !== "es") return enValue;
  return es?.trim() || enValue;
}

function localizedItems(
  en: { item: string }[] | null | undefined,
  es: { item: string }[] | null | undefined,
  locale: Locale,
) {
  const clean = (rows: { item: string }[] | null | undefined) =>
    (rows ?? []).flatMap((row) => (row.item?.trim() ? [row.item.trim()] : []));
  const enItems = clean(en);
  if (locale !== "es") return enItems;
  const esItems = clean(es);
  return esItems.length ? esItems : enItems;
}

function richTextPlainText(node: { children?: unknown; text?: unknown; type?: unknown }): string {
  if (typeof node.text === "string") return node.text;
  if (!Array.isArray(node.children)) return "";
  const parts = node.children
    .map((child) => (child && typeof child === "object" ? richTextPlainText(child) : ""));
  // Blocks under the root read as separate sentences; inline nodes concatenate.
  return node.type === "root"
    ? parts.map((part) => part.trim()).filter(Boolean).join(" ")
    : parts.join("");
}

// Member-owned contact line (DESIGN §5): the member is the subject; the line
// exists only when the member lists a discord link.
function discordContactLine(name: string, topics: string[], locale: Locale) {
  const topicList = topics.slice(0, 3).join(", ");
  if (locale === "es") {
    return topicList
      ? `${name} responde preguntas sobre ${topicList} en Discord.`
      : `${name} responde preguntas en Discord.`;
  }
  return topicList
    ? `${name} answers questions about ${topicList} on Discord.`
    : `${name} answers questions on Discord.`;
}

function personBase(
  person: Person,
  locale: Locale,
  publicOnly = false,
): Omit<PublishedCMSPerson, "contribution"> | null {
  const image = publicImage(person.portrait);
  if (!image || !person.city || !person.identity || !person.introduction || !person.languages?.length || !person.slug) return null;
  const editorialBio = localizedRichText(person.editorialBio, person.editorialBioEs, locale, publicOnly);
  const bioThirdPerson = editorialBio ? richTextPlainText(editorialBio.root).trim() : "";
  const epithet = localizedLine(person.verdict, person.verdictEs, locale);
  const hanziName = person.nameZh?.trim();
  const topics = taxonomyNames(person.topics);
  const links = (person.links ?? []).flatMap((link) => {
    const type = link.type || "personal_site";
    const url = safeExternalURL(link.url, type);
    const label = locale === "es" ? link.labelEs || link.label : link.label;
    return url ? [{ label, type, url }] : [];
  });
  const hasDiscord = links.some((link) => link.type === "discord");
  return {
    ...(bioThirdPerson ? { bioThirdPerson } : {}),
    canHelpWith: localizedItems(person.canHelpWith, person.canHelpWithEs, locale),
    city: locale === "es" ? person.cityEs || person.city : person.city,
    ...(hasDiscord ? { discordLine: discordContactLine(person.name, topics, locale) } : {}),
    editorialBio,
    ...(epithet ? { epithet } : {}),
    ...(hanziName ? { hanziName } : {}),
    identity: locale === "es" ? person.identityEs || person.identity : person.identity,
    image,
    introduction: locale === "es" ? person.introductionEs || person.introduction : person.introduction,
    languages: person.languages,
    links,
    name: person.name,
    quote: localizedLine(person.quote, person.quoteEs, locale),
    slug: person.slug,
    spotlightExcluded: person.spotlightExcluded ?? false,
    spotlightPinnedUntil: person.spotlightPinnedUntil ?? null,
    topics,
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
    const base = personBase(person, locale, true);
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
