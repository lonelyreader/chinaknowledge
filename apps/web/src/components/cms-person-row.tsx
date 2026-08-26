import type { Locale } from "@/content";
import type { PublishedCMSPerson } from "@/content/cms";
import { siteMediaSource } from "@/content/media";
import { PersonConnectionRow } from "@/components/community/person-connection-row";

function contributionPath(locale: Locale, person: PublishedCMSPerson) {
  return person.contribution ? `/${locale}/posts/${person.contribution.slug}` : null;
}

export function CMSPersonRow({
  person,
  locale,
  featured = false,
}: {
  person: PublishedCMSPerson;
  locale: Locale;
  featured?: boolean;
}) {
  void featured;
  const contributionURL = contributionPath(locale, person);
  return (
    <PersonConnectionRow
      canHelpWith={person.canHelpWith}
      city={person.city}
      currentWorkLabel={locale === "en" ? "Current work" : "Trabajo actual"}
      currentWork={contributionURL && person.contribution ? {
        href: contributionURL,
        title: person.contribution.title,
      } : undefined}
      identity={person.identity}
      image={{ alt: person.image.alt, src: siteMediaSource(person.image.url), unoptimized: true }}
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
