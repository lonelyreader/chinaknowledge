import Link from "next/link";

import { ArticleBylineLink } from "@/components/article-byline";
import { CMSPersonRow } from "@/components/cms-person-row";
import { NewsletterForm } from "@/components/newsletter-form";
import { PersonRow } from "@/components/person-row";
import { drivingGuide, kindLabels, localize, people, requireLocale, stories, ui } from "@/content";
import { articlePath, cmsReadEnabled, getPublishedCMSHomepage, getPublishedCMSPeople } from "@/content/cms";

export const dynamic = "force-dynamic";

const discordInvite = "https://discord.gg/CCUbfaRVd2";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale);
  const copy = ui[locale];
  const labels = locale === "en" ? {
    community: "Community",
    discordAction: "Join Discord",
    discordTitle: "Keep the conversation going",
    find: "Find people",
    peopleTitle: "People to meet",
    search: "Search by name, place or interest",
    storiesTitle: "From the community",
    viewAll: "View all people",
    workTitle: "What people are working on",
  } : {
    community: "Comunidad",
    discordAction: "Unirse a Discord",
    discordTitle: "Sigue la conversación",
    find: "Buscar personas",
    peopleTitle: "Personas que conocer",
    search: "Buscar por nombre, lugar o interés",
    storiesTitle: "Desde la comunidad",
    viewAll: "Ver todas las personas",
    workTitle: "En qué están trabajando",
  };

  if (cmsReadEnabled()) {
    const [homepage, cmsPeople] = await Promise.all([
      getPublishedCMSHomepage(locale),
      getPublishedCMSPeople(locale),
    ]);
    const peopleWithWork = cmsPeople.filter((person) => person.contribution).slice(0, 3);
    const supportingArticles = [homepage.lead, ...homepage.selected, ...homepage.articles]
      .filter((article, index, items): article is NonNullable<typeof article> => Boolean(article) && items.findIndex((item) => item?.slug === article?.slug) === index)
      .slice(0, 3);

    return (
      <main className="community-page community-home">
        <section className="page-shell community-home-hero">
          <p>{labels.community}</p>
          <h1>{locale === "en" ? "Meet interesting people in China" : "Conoce a gente interesante en China"}</h1>
          <form className="community-search" action={`/${locale}/people`} method="get">
            <input aria-label={labels.search} name="q" placeholder={labels.search} type="search" />
            <button type="submit">{labels.find}</button>
          </form>
        </section>

        {cmsPeople.length ? (
          <section className="page-shell community-section" aria-labelledby="people-to-meet">
            <div className="community-section-heading">
              <h2 id="people-to-meet">{labels.peopleTitle}</h2>
              <Link href={`/${locale}/people`}>{labels.viewAll} →</Link>
            </div>
            <div className="community-person-list">
              {cmsPeople.slice(0, 6).map((person) => <CMSPersonRow key={person.slug} person={person} locale={locale} />)}
            </div>
          </section>
        ) : null}

        {peopleWithWork.length ? (
          <section className="page-shell community-section" aria-labelledby="current-work">
            <div className="community-section-heading"><h2 id="current-work">{labels.workTitle}</h2></div>
            <div className="community-work-grid">
              {peopleWithWork.map((person) => person.contribution ? (
                <article className="community-work-card" key={person.slug}>
                  <p>{person.name} · {person.city}</p>
                  <h3><Link href={`/${locale}/posts/${person.contribution.slug}`}>{person.contribution.title}</Link></h3>
                  {person.topics.length ? <div>{person.topics.slice(0, 2).map((topic) => <span key={topic}>{topic}</span>)}</div> : null}
                </article>
              ) : null)}
            </div>
          </section>
        ) : null}

        <section className="page-shell community-discord">
          <div>
            <p>Discord</p>
            <h2>{labels.discordTitle}</h2>
          </div>
          <a href={discordInvite} rel="noreferrer" target="_blank">{labels.discordAction} ↗</a>
        </section>

        {supportingArticles.length ? (
          <section className="page-shell community-section" aria-labelledby="community-stories">
            <div className="community-section-heading"><h2 id="community-stories">{labels.storiesTitle}</h2></div>
            <div className="community-story-grid">
              {supportingArticles.map((article) => (
                <article key={`${article.format}-${article.slug}`}>
                  <p>{article.format === "guide" ? copy.guide : (locale === "en" ? "Story" : "Historia")}</p>
                  <h3><Link href={articlePath(locale, article)}>{article.title}</Link></h3>
                  <ArticleBylineLink author={article.author} locale={locale} />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="community-newsletter">
          <div className="page-shell community-newsletter__inner">
            <h2>{copy.newsletter}</h2>
            <NewsletterForm locale={locale} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="community-page community-home">
      <section className="page-shell community-home-hero">
        <p>{labels.community}</p>
        <h1>{locale === "en" ? "Meet interesting people in China" : "Conoce a gente interesante en China"}</h1>
        <form className="community-search" action={`/${locale}/people`} method="get">
          <input aria-label={labels.search} name="q" placeholder={labels.search} type="search" />
          <button type="submit">{labels.find}</button>
        </form>
      </section>

      <section className="page-shell community-section" aria-labelledby="people-to-meet">
        <div className="community-section-heading">
          <h2 id="people-to-meet">{labels.peopleTitle}</h2>
          <Link href={`/${locale}/people`}>{labels.viewAll} →</Link>
        </div>
        <div className="community-person-list">
          {people.slice(0, 6).map((person) => <PersonRow key={person.slug} person={person} locale={locale} />)}
        </div>
      </section>

      <section className="page-shell community-section" aria-labelledby="current-work">
        <div className="community-section-heading"><h2 id="current-work">{labels.workTitle}</h2></div>
        <div className="community-work-grid">
          {people.slice(0, 3).map((person) => (
            <article className="community-work-card" key={person.slug}>
              <p>{person.name} · {localize(person.city, locale)}</p>
              <h3><Link href={person.slug === "chen-rui" ? `/${locale}/guides/${drivingGuide.slug}` : `/${locale}/people/${person.slug}`}>{localize(person.contribution, locale)}</Link></h3>
              <div>{person.topics.slice(0, 2).map((topic) => <span key={topic.en}>{localize(topic, locale)}</span>)}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell community-discord">
        <div><p>Discord</p><h2>{labels.discordTitle}</h2></div>
        <a href={discordInvite} rel="noreferrer" target="_blank">{labels.discordAction} ↗</a>
      </section>

      <section className="page-shell community-section" aria-labelledby="community-stories">
        <div className="community-section-heading"><h2 id="community-stories">{labels.storiesTitle}</h2></div>
        <div className="community-story-grid">
          {stories.slice(0, 3).map((story) => {
            const author = people.find((person) => person.slug === story.authorSlug)!;
            return (
              <article key={story.slug}>
                <p>{kindLabels[locale][story.kind]}</p>
                <h3><Link href={story.slug === "morning-routes-shanghai" ? `/${locale}/guides/${drivingGuide.slug}` : `/${locale}/people/${author.slug}`}>{localize(story.title, locale)}</Link></h3>
                <Link href={`/${locale}/people/${author.slug}`}>{author.name}</Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="community-newsletter">
        <div className="page-shell community-newsletter__inner">
          <h2>{copy.newsletter}</h2>
          <NewsletterForm locale={locale} />
        </div>
      </section>
    </main>
  );
}
