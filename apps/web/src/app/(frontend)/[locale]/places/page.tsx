import Image from "next/image";
import Link from "next/link";
import { localize, people, requireLocale, stories } from "@/content";
import { cmsReadEnabled, getPublishedCMSPlaces, placePath } from "@/content/cms";

export const dynamic = "force-dynamic";

export default async function PlacesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  if (cmsReadEnabled()) {
    const places = await getPublishedCMSPlaces(locale);
    return (
      <main className="page-shell index-page">
        <header className="index-header"><p className="meta">{locale === "en" ? "Places" : "Lugares"}</p><h1>{locale === "en" ? "Places, through daily attention" : "Lugares, desde la atención cotidiana"}</h1></header>
        <div className="place-grid">
          {places.map((place) => (
            <article className="place-card" key={place.slug}>
              <Link className="place-card__image" href={placePath(locale, place)}>
                <Image src={place.coverImage.url} alt={place.coverImage.alt} fill sizes="(max-width: 767px) 100vw, 50vw" />
              </Link>
              <p className="meta">{place.geography.name}</p>
              <h2><Link href={placePath(locale, place)}>{place.name}</Link></h2>
              <p>{place.summary}</p>
            </article>
          ))}
        </div>
      </main>
    );
  }
  const placeStory = stories.find((story) => story.kind === "Place")!;
  const author = people.find((person) => person.slug === placeStory.authorSlug)!;
  return (
    <main className="page-shell index-page">
      <header className="index-header"><p className="meta">{locale === "en" ? "Places" : "Lugares"}</p><h1>{locale === "en" ? "Places, through daily attention" : "Lugares, desde la atención cotidiana"}</h1></header>
      <article className="index-lead"><p className="meta">Wuhan · {placeStory.date}</p><h2>{localize(placeStory.title, locale)}</h2><p>{localize(placeStory.summary, locale)}</p><Link className="text-link" href={`/${locale}/people/${author.slug}`}>{author.name}</Link></article>
    </main>
  );
}
