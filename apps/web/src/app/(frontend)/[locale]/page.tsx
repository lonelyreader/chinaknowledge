import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { CMSPersonRow } from "@/components/cms-person-row";
import { PersonRow } from "@/components/person-row";
import { drivingGuide, kindLabels, localize, people, requireLocale, stories, ui } from "@/content";
import { articlePath, cmsReadEnabled, getPublishedCMSHomepage, getPublishedCMSHomepagePeople, getPublishedCMSPlaces, placePath, stableWeeklyPeople } from "@/content/cms";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  const copy = ui[locale];
  if (cmsReadEnabled()) {
    const [homepage, cmsPlaces, cmsPeople] = await Promise.all([
      getPublishedCMSHomepage(locale),
      getPublishedCMSPlaces(locale),
      getPublishedCMSHomepagePeople(locale),
    ]);
    const { articles, lead, selected } = homepage;
    const featuredPeople = stableWeeklyPeople(cmsPeople, 4);
    const hasEditorialContent = Boolean(
      lead || selected.length || articles.length || cmsPlaces.length || featuredPeople.length,
    );
    const purposeSlugs = ["understand", "visit", "live", "study", "work", "business"];

    return (
      <main>
        <nav className="purpose-nav" aria-label="Purpose">
          {copy.purpose.map((purpose, index) => <Link key={purpose} href={`/${locale}/purposes/${purposeSlugs[index]}`}>{purpose}</Link>)}
        </nav>

        {lead ? (
          <section className="home-hero page-shell">
            <div className="home-hero__copy">
              <p className="meta">{lead.purposes[0] ?? (lead.format === "guide" ? copy.guide : "Story")} · {lead.publishedAt.slice(0, 10)}</p>
              <h1><Link href={articlePath(locale, lead)}>{lead.title}</Link></h1>
              <p className="dek">{lead.summary}</p>
              <div className="hero-byline">
                <Image src={lead.author.image.url} alt={lead.author.image.alt} width={64} height={64} unoptimized />
                <div>
                  <Link href={`/${locale}/people/${lead.author.slug}`}>{lead.author.name}</Link>
                  <span>{lead.author.identity}, {lead.author.city}</span>
                </div>
              </div>
            </div>
            <Link className="home-hero__image" href={articlePath(locale, lead)}>
              <Image src={lead.coverImage.url} alt={lead.coverImage.alt} fill priority unoptimized sizes="(max-width: 767px) 100vw, 50vw" />
            </Link>
          </section>
        ) : null}

        {selected.length ? (
          <section className="page-shell editorial-section">
            <div className="section-heading"><h2>{copy.selected}</h2></div>
            <div className="selected-grid">
              {selected.map((article, index) => (
                <article className={index === 0 ? "selected-story selected-story--lead" : "selected-story"} key={article.slug}>
                  <p className="meta">{article.format === "guide" ? copy.guide : "Story"}{article.purposes[0] ? ` · ${article.purposes[0]}` : ""}</p>
                  <h3><Link href={articlePath(locale, article)}>{article.title}</Link></h3>
                  <p>{article.summary}</p>
                  <Link className="text-link" href={`/${locale}/people/${article.author.slug}`}>{article.author.name}, {article.author.city}</Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {articles.length ? (
          <section className="page-shell stream-section">
            <div className="section-heading"><h2>{copy.latest}</h2></div>
            <div className="story-stream">
              {articles.slice(0, 12).map((article) => (
                <article className="story-line" key={`${article.format}-${article.slug}`}>
                  <p className="meta">{article.format === "guide" ? copy.guide : "Story"}<br />{article.publishedAt.slice(0, 10)}</p>
                  <h3><Link href={articlePath(locale, article)}>{article.title}</Link></h3>
                  <Link href={`/${locale}/people/${article.author.slug}`}>{article.author.name}</Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {cmsPlaces.length ? (
          <section className="page-shell editorial-section">
            <div className="section-heading section-heading--inline">
              <h2>{locale === "en" ? "Places" : "Lugares"}</h2>
              <Link className="text-link" href={`/${locale}/places`}>{locale === "en" ? "All places" : "Todos los lugares"} →</Link>
            </div>
            <div className="place-grid place-grid--compact">
              {cmsPlaces.slice(0, 3).map((place) => (
                <article className="place-card" key={place.slug}>
                  <Link className="place-card__image" href={placePath(locale, place)}>
                    <Image src={place.coverImage.url} alt={place.coverImage.alt} fill unoptimized sizes="(max-width: 767px) 100vw, 33vw" />
                  </Link>
                  <p className="meta">{place.geography.name}</p>
                  <h3><Link href={placePath(locale, place)}>{place.name}</Link></h3>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {featuredPeople.length ? (
          <section className="people-passage">
            <div className="page-shell">
              <div className="section-heading section-heading--inline">
                <h2>{copy.people}</h2>
                <Link className="text-link" href={`/${locale}/people`}>{copy.allPeople} →</Link>
              </div>
              <div className="people-passage__grid">
                {featuredPeople.map((person) => <CMSPersonRow key={person.slug} person={person} locale={locale} />)}
              </div>
            </div>
          </section>
        ) : null}

        <section className="newsletter-band">
          <div className="page-shell newsletter-band__inner">
            {hasEditorialContent ? <h2>{copy.newsletter}</h2> : <h1>{copy.newsletter}</h1>}
            <NewsletterForm locale={locale} />
          </div>
        </section>
      </main>
    );
  }
  const lead = stories[0];
  const leadAuthor = people.find((person) => person.slug === lead.authorSlug)!;

  return (
    <main>
      <nav className="purpose-nav" aria-label="Purpose">
        {copy.purpose.map((purpose) => <Link key={purpose} href={`/${locale}/stories`}>{purpose}</Link>)}
      </nav>

      <section className="home-hero page-shell">
        <div className="home-hero__copy">
          <p className="meta">{localize(lead.purpose, locale)} · {lead.date}</p>
          <h1>{localize(lead.title, locale)}</h1>
          <p className="dek">{localize(lead.summary, locale)}</p>
          <div className="hero-byline">
            <Image src={leadAuthor.image} alt={`${locale === "en" ? "Portrait of" : "Retrato de"} ${leadAuthor.name}`} width={64} height={64} />
            <div>
              <Link href={`/${locale}/people/${leadAuthor.slug}`}>{leadAuthor.name}</Link>
              <span>{localize(leadAuthor.identity, locale)}, {localize(leadAuthor.city, locale)}</span>
            </div>
          </div>
        </div>
        <Link className="home-hero__image" href={`/${locale}/guides/driving-in-shanghai`}>
          <Image src="/images/fixtures/shanghai-morning.webp" alt={locale === "en" ? "A Shanghai neighborhood street in the morning" : "Una calle de barrio en Shanghái por la mañana"} fill priority sizes="(max-width: 767px) 100vw, 50vw" />
        </Link>
      </section>

      <section className="page-shell editorial-section">
        <div className="section-heading"><h2>{copy.selected}</h2></div>
        <div className="selected-grid">
          {stories.slice(1, 3).map((story, index) => {
            const author = people.find((person) => person.slug === story.authorSlug)!;
            return (
              <article className={index === 0 ? "selected-story selected-story--lead" : "selected-story"} key={story.slug}>
                <p className="meta">{kindLabels[locale][story.kind]} · {localize(story.purpose, locale)}</p>
                <h3>{localize(story.title, locale)}</h3>
                <p>{localize(story.summary, locale)}</p>
                <Link className="text-link" href={`/${locale}/people/${author.slug}`}>{author.name}, {localize(author.city, locale)}</Link>
              </article>
            );
          })}
          <article className="guide-promo">
            <p className="meta">{copy.recent} · {drivingGuide.reviewed}</p>
            <h3><Link href={`/${locale}/guides/${drivingGuide.slug}`}>{localize(drivingGuide.title, locale)}</Link></h3>
            <p>{localize(drivingGuide.summary, locale)}</p>
          </article>
        </div>
      </section>

      <section className="page-shell stream-section">
        <div className="section-heading"><h2>{copy.latest}</h2></div>
        <div className="story-stream">
          {stories.map((story) => {
            const author = people.find((person) => person.slug === story.authorSlug)!;
            return (
              <article className="story-line" key={story.slug}>
                <p className="meta">{kindLabels[locale][story.kind]}<br />{story.date}</p>
                <h3>{localize(story.title, locale)}</h3>
                <Link href={`/${locale}/people/${author.slug}`}>{author.name}</Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="people-passage">
        <div className="page-shell">
          <div className="section-heading section-heading--inline">
            <h2>{copy.people}</h2>
            <Link className="text-link" href={`/${locale}/people`}>{copy.allPeople} →</Link>
          </div>
          <div className="people-passage__grid">
            {people.slice(0, 4).map((person) => <PersonRow key={person.slug} person={person} locale={locale} />)}
          </div>
        </div>
      </section>

      <section className="newsletter-band">
        <div className="page-shell newsletter-band__inner">
          <h2>{copy.newsletter}</h2>
          <NewsletterForm locale={locale} />
        </div>
      </section>
    </main>
  );
}
