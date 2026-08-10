import type { Article, Person, Taxonomy } from "@/payload-types";

export type PublicationSummary = {
  author: string;
  classification: string;
  cover: string;
  freshness: string;
  language: string;
  missing: string[];
  object: string;
  sources: string;
  title: string;
  url: string;
};

const formatLabels: Record<NonNullable<Article["format"]>, string> = {
  analysis: "Analysis",
  first_person: "First person",
  guide: "Guide",
  reporting: "Reporting",
  update: "Update",
};

function relationshipName(value: number | Taxonomy) {
  return typeof value === "object" ? value.name : null;
}

function relationshipNames(values: (number | Taxonomy)[] | null | undefined) {
  return (values ?? []).flatMap((value) => {
    const name = relationshipName(value);
    return name ? [name] : [];
  });
}

export function buildPublicationSummary(article: Article): PublicationSummary {
  const siteAuthorship = article.authorshipType === "site";
  const author = siteAuthorship
    ? "China, in Fact"
    : typeof article.author === "object"
    ? (article.author as Person).name
    : "Not set";
  const classification = [
    ...relationshipNames(article.purposes),
    ...relationshipNames(article.topics),
    ...relationshipNames(article.geographies),
    ...relationshipNames(article.situations),
  ];
  const sources = (article.sourceNotes ?? []).map((source) => source.label).filter(Boolean);
  const person = typeof article.author === "object" ? (article.author as Person) : null;
  const missing = [
    ...(!siteAuthorship && !article.coverImage ? ["Cover"] : []),
    ...(!sources.length ? ["Sources"] : []),
    ...(article.format === "guide" && !article.freshnessDate ? ["Freshness"] : []),
    ...(!siteAuthorship && !person?.portrait ? ["Author portrait"] : []),
    ...(!article.format ? ["Section"] : []),
  ];

  return {
    author,
    classification: classification.join(", ") || "Not set",
    cover: article.coverImage ? "Set" : "Not set",
    freshness: article.freshnessDate?.slice(0, 10) || "Not set",
    language: article.locale === "es" ? "Spanish" : "English",
    missing,
    object: article.format ? formatLabels[article.format] : "Not set",
    sources: sources.join(", ") || "Not set",
    title: article.title,
    url: `/${article.locale}/posts/${article.slug}`,
  };
}
