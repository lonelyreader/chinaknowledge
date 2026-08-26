import { localize, type Locale, type Person } from "@/content";
import { PersonConnectionRow } from "@/components/community/person-connection-row";

export function PersonRow({ person, locale, featured = false }: { person: Person; locale: Locale; featured?: boolean }) {
  void featured;
  const profileHref = `/${locale}/people/${person.slug}`;
  return (
    <PersonConnectionRow
      city={localize(person.city, locale)}
      currentWorkLabel={locale === "en" ? "Current work" : "Trabajo actual"}
      currentWork={{
        href: person.slug === "chen-rui" ? `/${locale}/guides/driving-in-shanghai` : profileHref,
        title: localize(person.contribution, locale),
      }}
      identity={localize(person.identity, locale)}
      image={{
        alt: `${locale === "en" ? "Portrait of" : "Retrato de"} ${person.name}`,
        src: person.image,
      }}
      name={person.name}
      profileHref={profileHref}
      tagsLabel={locale === "en" ? "Topics" : "Temas"}
      topics={person.topics.map((topic) => localize(topic, locale))}
      viewLabel={locale === "en" ? "View" : "Ver"}
    />
  );
}
