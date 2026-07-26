export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];
export type LocalizedText = Record<Locale, string>;

export type Person = {
  slug: string;
  name: string;
  identity: LocalizedText;
  city: LocalizedText;
  topics: LocalizedText[];
  contribution: LocalizedText;
  introduction: LocalizedText;
  image: string;
  links: { label: string; href: string }[];
};

export type Story = {
  slug: string;
  kind: "Story" | "Guide" | "Place";
  title: LocalizedText;
  summary: LocalizedText;
  authorSlug: string;
  date: string;
  purpose: LocalizedText;
};

export type Guide = Story & {
  kind: "Guide";
  reviewed: string;
  sections: { heading: LocalizedText; body: LocalizedText[] }[];
  sources: LocalizedText[];
};
