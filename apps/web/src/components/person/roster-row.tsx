import type { Locale } from "@/content";
import type { PublishedCMSPerson } from "@/content/cms";
import { PersonConnectionRow } from "@/components/community/person-connection-row";

export function PersonRosterRow({ person, locale }: { person: PublishedCMSPerson; locale: Locale }) {
  return (
    <PersonConnectionRow
      canHelpWith={person.canHelpWith}
      city={person.city}
      currentWorkLabel={locale === "en" ? "Current work" : "Trabajo actual"}
      currentWork={person.contribution ? {
        href: `/${locale}/posts/${person.contribution.slug}`,
        title: person.contribution.title,
      } : undefined}
      identity={person.identity}
      image={{ alt: person.image.alt, src: person.image.url, unoptimized: true }}
      languages={person.languages}
      name={person.name}
      profileHref={`/${locale}/people/${person.slug}`}
      tagsLabel={person.canHelpWith.length
        ? (locale === "en" ? "Can help with" : "Puede ayudar con")
        : (locale === "en" ? "Topics" : "Temas")}
      topics={person.topics}
      viewLabel={locale === "en" ? "View" : "Ver"}
    />
  );
}
