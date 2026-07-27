import "server-only";

import { getPayload } from "payload";

import config from "@payload-config";
import type { Article, Person, Taxonomy } from "@/payload-types";
import type { Locale } from "./types";

export type PublishedCMSGuide = {
  author: Pick<Person, "city" | "identity" | "introduction" | "name" | "slug">;
  body: NonNullable<Article["body"]>;
  freshnessDate: string | null;
  purpose: string | null;
  slug: string;
  sources: { label: string; url?: string | null }[];
  summary: string;
  title: string;
};

export function cmsReadEnabled() {
  return process.env.CMS_READ_MODE === "cms";
}

function taxonomyName(value: number | Taxonomy | null | undefined) {
  return value && typeof value === "object" ? value.name : null;
}

function toPublishedGuide(article: Article): PublishedCMSGuide | null {
  if (!article.body || typeof article.author !== "object") return null;
  return {
    author: {
      city: article.author.city,
      identity: article.author.identity,
      introduction: article.author.introduction,
      name: article.author.name,
      slug: article.author.slug,
    },
    body: article.body,
    freshnessDate: article.freshnessDate ?? null,
    purpose: taxonomyName(article.purposes?.[0]),
    slug: article.slug,
    sources: (article.sourceNotes ?? []).map((source) => ({
      label: source.label,
      url: source.url,
    })),
    summary: article.summary,
    title: article.title,
  };
}

export async function getPublishedCMSGuide(locale: Locale, slug: string) {
  if (!cmsReadEnabled()) return null;
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "articles",
    depth: 2,
    limit: 1,
    overrideAccess: false,
    where: {
      and: [
        { format: { equals: "guide" } },
        { locale: { equals: locale } },
        { slug: { equals: slug } },
      ],
    },
  });
  return result.docs[0] ? toPublishedGuide(result.docs[0]) : null;
}

export async function getPublishedCMSGuides(locale: Locale) {
  if (!cmsReadEnabled()) return [];
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "articles",
    depth: 2,
    limit: 24,
    overrideAccess: false,
    sort: "-freshnessDate",
    where: {
      and: [{ format: { equals: "guide" } }, { locale: { equals: locale } }],
    },
  });
  return result.docs.flatMap((article) => {
    const guide = toPublishedGuide(article);
    return guide ? [guide] : [];
  });
}
