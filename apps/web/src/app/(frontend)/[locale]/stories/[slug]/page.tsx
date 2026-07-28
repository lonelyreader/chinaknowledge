import { notFound, permanentRedirect } from "next/navigation";

import { requireLocale } from "@/content";
import { articlePath, cmsReadEnabled, resolvePublishedCMSArticle } from "@/content/cms";

export const dynamic = "force-dynamic";

export default async function LegacyStoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  if (!cmsReadEnabled()) notFound();
  const article = (await resolvePublishedCMSArticle(locale, slug))?.article;
  if (!article) notFound();
  permanentRedirect(articlePath(locale, article));
}
