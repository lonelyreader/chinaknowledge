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

const formatLabels: Record<Article["format"], string> = {
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
  const author = typeof article.author === "object"
    ? (article.author as Person).name
    : "Not set";
  const classification = [
    ...relationshipNames(article.purposes),
    ...relationshipNames(article.topics),
    ...relationshipNames(article.geographies),
    ...relationshipNames(article.situations),
  ];
  const section = article.format === "guide" ? "guides" : "stories";
  const sources = (article.sourceNotes ?? []).map((source) => source.label).filter(Boolean);
  const person = typeof article.author === "object" ? (article.author as Person) : null;
  const missing = [
    ...(!article.coverImage ? ["Cover"] : []),
    ...(!sources.length ? ["Sources"] : []),
    ...(article.format === "guide" && !article.freshnessDate ? ["Freshness"] : []),
    ...(!person?.portrait ? ["Author portrait"] : []),
    ...(!person?.authorApprovalRecordedAt ? ["Author approval"] : []),
  ];

  return {
    author,
    classification: classification.join(", ") || "Not set",
    cover: article.coverImage ? "Set" : "Not set",
    freshness: article.freshnessDate?.slice(0, 10) || "Not set",
    language: article.locale === "es" ? "Spanish" : "English",
    missing,
    object: formatLabels[article.format],
    sources: sources.join(", ") || "Not set",
    title: article.title,
    url: `/${article.locale}/${section}/${article.slug}`,
  };
}
