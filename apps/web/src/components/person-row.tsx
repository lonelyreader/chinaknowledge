import Image from "next/image";
import Link from "next/link";
import { localize, type Locale, type Person } from "@/content";

export function PersonRow({ person, locale, featured = false }: { person: Person; locale: Locale; featured?: boolean }) {
  return (
    <article className={featured ? "person-card person-card--featured" : "person-row"}>
      <Link className="person-image" href={`/${locale}/people/${person.slug}`} aria-label={person.name}>
        <Image
          src={person.image}
          alt={`${locale === "en" ? "Portrait of" : "Retrato de"} ${person.name}`}
          fill
          sizes={featured ? "(max-width: 767px) 100vw, 55vw" : "96px"}
          loading={featured ? "eager" : "lazy"}
          fetchPriority={featured ? "high" : "auto"}
        />
      </Link>
      <div className="person-copy">
        <p className="person-place">{localize(person.city, locale)}</p>
        <h3><Link href={`/${locale}/people/${person.slug}`}>{person.name}</Link></h3>
        <p>{localize(person.identity, locale)}</p>
        <Link className="contribution-link" href={person.slug === "chen-rui" ? `/${locale}/guides/driving-in-shanghai` : `/${locale}/people/${person.slug}`}>
          {localize(person.contribution, locale)}
        </Link>
      </div>
    </article>
  );
}
