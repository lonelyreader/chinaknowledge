import type { MetadataRoute } from "next";

import { validateServerEnvironment } from "@/config/environment";
import {
  articlePath,
  getPublishedCMSArticleIndex,
  getPublishedCMSPeople,
  getPublishedCMSPlaces,
  placePath,
} from "@/content/cms";
import type { Locale } from "@/content/types";

function origin() {
  return (process.env.PAYLOAD_PUBLIC_SERVER_URL || "https://chinainfact.com").replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!validateServerEnvironment().indexable) return [];
  const locales: Locale[] = ["en", "es"];
  const site = origin();
  const dynamic = await Promise.all(locales.map(async (locale) => {
    const [articles, people, places] = await Promise.all([
      getPublishedCMSArticleIndex(locale),
      getPublishedCMSPeople(locale),
      getPublishedCMSPlaces(locale),
    ]);
    const topicSlugs = [...new Set(articles.flatMap((article) => article.topicSlugs))];
    return [
      ...articles.map((article) => ({ lastModified: article.updatedAt, url: `${site}${articlePath(locale, article)}` })),
      ...people.map((person) => ({ url: `${site}/${locale}/people/${person.slug}` })),
      ...places.map((place) => ({ lastModified: place.publishedAt, url: `${site}${placePath(locale, place)}` })),
      ...topicSlugs.map((slug) => ({ url: `${site}/${locale}/topics/${slug}` })),
    ];
  }));
  const purposeSlugs = ["understand", "visit", "live", "study", "work", "business"];
  const staticPages = locales.flatMap((locale) => ["", "/stories", "/guides", "/people", "/places", "/about", "/privacy", ...purposeSlugs.map((slug) => `/purposes/${slug}`)]
    .map((path) => ({ url: `${site}/${locale}${path}` })));
  return [...staticPages, ...dynamic.flat()];
}
