import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/content";
import type { PublishedCMSPerson } from "@/content/cms";

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
  const contributionURL = contributionPath(locale, person);
  return (
    <article className={featured ? "person-card person-card--featured" : "person-row"}>
      <Link className="person-image" href={`/${locale}/people/${person.slug}`} aria-label={person.name}>
        <Image
          src={person.image.url}
          alt={person.image.alt}
          fill
          unoptimized
          sizes={featured ? "(max-width: 767px) 100vw, 55vw" : "96px"}
          loading={featured ? "eager" : "lazy"}
          fetchPriority={featured ? "high" : "auto"}
        />
      </Link>
      <div className="person-copy">
        <p className="person-place">{person.city}</p>
        <h3><Link href={`/${locale}/people/${person.slug}`}>{person.name}</Link></h3>
        <p>{person.identity}</p>
        {contributionURL && person.contribution ? (
          <Link className="contribution-link" href={contributionURL}>
            {person.contribution.title}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
