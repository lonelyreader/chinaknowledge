import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { PersonRow } from "@/components/person-row";
import { drivingGuide, kindLabels, localize, people, requireLocale, stories, ui } from "@/content";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  const copy = ui[locale];
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
