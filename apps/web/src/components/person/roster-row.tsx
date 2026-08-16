import Link from "next/link";

import type { Locale } from "@/content";
import type { PublishedCMSPerson } from "@/content/cms";

export function PersonRosterRow({ person, locale }: { person: PublishedCMSPerson; locale: Locale }) {
  return (
    <article className="person-roster-row">
      <h3 className="person-roster-line">
        {person.epithet ? <span className="person-roster-verdict">{person.epithet}</span> : null}
        {person.epithet ? <span aria-hidden="true" className="person-roster-dash"> — </span> : null}
        <Link href={`/${locale}/people/${person.slug}`}>{person.name}</Link>
      </h3>
      <p className="meta person-roster-meta">{person.identity} · {person.city}</p>
      {person.contribution ? (
        <Link className="person-roster-work" href={`/${locale}/posts/${person.contribution.slug}`}>
          {person.contribution.title}
        </Link>
      ) : null}
    </article>
  );
}
