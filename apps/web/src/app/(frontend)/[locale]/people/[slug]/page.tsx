import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { CMSRichText } from "@/components/CMSRichText";
import { getPerson, kindLabels, localize, locales, people, requireLocale, stories } from "@/content";
import { articlePath, cmsReadEnabled, getPreviewCMSPerson, getPublishedCMSPerson, getPublishedCMSPersonArticles } from "@/content/cms";
import { siteMediaSource } from "@/content/media";

export const dynamic = "force-dynamic";

const discordInvite = "https://discord.gg/CCUbfaRVd2";

export function generateStaticParams() {
  return locales.flatMap((locale) => people.map((person) => ({ locale, slug: person.slug })));
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ preview?: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const { preview } = await searchParams;
  const locale = requireLocale(rawLocale);
  if (cmsReadEnabled()) {
    if (preview) return { robots: { follow: false, index: false } };
    const person = await getPublishedCMSPerson(locale, slug);
    if (!person) return {};
    const languagePeople = await Promise.all(locales.map(async (targetLocale) => [
      targetLocale,
      await getPublishedCMSPerson(targetLocale, slug),
    ] as const));
    const languages = Object.fromEntries(languagePeople.flatMap(([targetLocale, localizedPerson]) =>
      localizedPerson ? [[targetLocale, `/${targetLocale}/people/${slug}`]] : [],
    ));
    return {
      title: person.name,
      description: person.epithet ?? person.identity,
      alternates: { canonical: `/${locale}/people/${slug}`, languages },
    };
  }
  const person = getPerson(slug);
  return person ? { title: person.name, description: localize(person.identity, locale) } : {};
}

export default async function PersonPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const { preview } = await searchParams;
  const locale = requireLocale(rawLocale);
  const labels = locale === "en" ? {
    about: "About",
    canHelp: "Can help with",
    connect: "Connect on Discord",
    contributions: "Contributions",
    currentWork: "Current work",
    now: "Now",
  } : {
    about: "Sobre esta persona",
    canHelp: "Puede ayudar con",
    connect: "Conectar en Discord",
    contributions: "Contribuciones",
    currentWork: "Trabajo actual",
    now: "Ahora",
  };

  if (cmsReadEnabled()) {
    const previewRequested = Boolean(preview && /^\d+$/.test(preview));
    const previewPerson = previewRequested
      ? await getPreviewCMSPerson(locale, preview!, new Headers(await headers()))
      : null;
    if (previewRequested && !previewPerson) notFound();
    const [person, authored] = await Promise.all([
      previewRequested ? Promise.resolve(previewPerson) : getPublishedCMSPerson(locale, slug),
      getPublishedCMSPersonArticles(locale, slug),
    ]);
    if (!person) notFound();
    const discord = person.links.find((link) => link.type === "discord");
    const primaryLinks = person.links.filter((link) => link.type !== "discord");

    return (
      <main className="community-page community-profile-page">
        <header className="page-shell community-profile-header">
          <div className="community-profile-header__portrait">
            <Image src={siteMediaSource(person.image.url)} alt={person.image.alt} fill priority unoptimized sizes="(max-width: 767px) 112px, 152px" />
          </div>
          <div className="community-profile-header__identity">
            <p>{person.city}</p>
            <h1>{person.name}</h1>
            <h2>{person.identity}</h2>
            <div className="community-profile-tags">
              {person.languages.map((language) => <span key={language}>{language.toUpperCase()}</span>)}
              {person.topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}
            </div>
          </div>
          <div className="community-profile-actions">
            {discord ? <a className="community-primary-action" href={discord.url} rel="noreferrer" target="_blank">{labels.connect} ↗</a> : null}
            {primaryLinks.map((link) => <a key={`${link.label}-${link.url}`} href={link.url} rel="noreferrer" target="_blank">{link.label} ↗</a>)}
          </div>
        </header>

        {person.contribution ? (
          <section className="page-shell community-profile-section community-profile-now" aria-labelledby="person-now">
            <p>{labels.now}</p>
            <div>
              <h2 id="person-now">{labels.currentWork}</h2>
              <h3><Link href={`/${locale}/posts/${person.contribution.slug}`}>{person.contribution.title}</Link></h3>
            </div>
          </section>
        ) : null}

        {person.canHelpWith.length ? (
          <section className="page-shell community-profile-section" aria-labelledby="can-help-with">
            <h2 id="can-help-with">{labels.canHelp}</h2>
            <div className="community-help-list">
              {person.canHelpWith.map((item) => <span key={item}>{item}</span>)}
            </div>
          </section>
        ) : null}

        {authored.length ? (
          <section className="page-shell community-profile-section" aria-labelledby="contributions">
            <h2 id="contributions">{labels.contributions}</h2>
            <div className="community-contribution-list">
              {authored.map((article) => (
                <article key={article.slug}>
                  <p>{article.format === "guide" ? (locale === "en" ? "Guide" : "Guía") : (locale === "en" ? "Story" : "Historia")} · {article.publishedAt.slice(0, 10)}</p>
                  <h3><Link href={articlePath(locale, article)}>{article.title}</Link></h3>
                  <Link href={articlePath(locale, article)}>{locale === "en" ? "View" : "Ver"} →</Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="page-shell community-profile-section community-profile-about" aria-labelledby="about-person">
          <h2 id="about-person">{labels.about}</h2>
          <div>
            {person.editorialBio ? <CMSRichText data={person.editorialBio} /> : <p>{person.introduction}</p>}
            {person.quote ? <blockquote><p>{person.quote}</p></blockquote> : null}
          </div>
        </section>
      </main>
    );
  }

  const person = getPerson(slug);
  if (!person) notFound();
  const authored = stories.filter((story) => story.authorSlug === person.slug);
  const contributionHref = person.slug === "chen-rui" ? `/${locale}/guides/driving-in-shanghai` : `/${locale}/people/${person.slug}`;

  return (
    <main className="community-page community-profile-page">
      <header className="page-shell community-profile-header">
        <div className="community-profile-header__portrait">
          <Image src={person.image} alt={`${locale === "en" ? "Portrait of" : "Retrato de"} ${person.name}`} fill priority sizes="(max-width: 767px) 112px, 152px" />
        </div>
        <div className="community-profile-header__identity">
          <p>{localize(person.city, locale)}</p>
          <h1>{person.name}</h1>
          <h2>{localize(person.identity, locale)}</h2>
          <div className="community-profile-tags">{person.topics.slice(0, 3).map((topic) => <span key={topic.en}>{localize(topic, locale)}</span>)}</div>
        </div>
        <div className="community-profile-actions">
          <a className="community-primary-action" href={discordInvite} rel="noreferrer" target="_blank">{labels.connect} ↗</a>
          {person.links.map((link) => <a key={link.label} href={link.href} rel="noreferrer" target="_blank">{link.label} ↗</a>)}
        </div>
      </header>

      <section className="page-shell community-profile-section community-profile-now" aria-labelledby="person-now">
        <p>{labels.now}</p>
        <div>
          <h2 id="person-now">{labels.currentWork}</h2>
          <h3><Link href={contributionHref}>{localize(person.contribution, locale)}</Link></h3>
        </div>
      </section>

      {authored.length ? (
        <section className="page-shell community-profile-section" aria-labelledby="contributions">
          <h2 id="contributions">{labels.contributions}</h2>
          <div className="community-contribution-list">
            {authored.map((story) => (
              <article key={story.slug}>
                <p>{kindLabels[locale][story.kind]} · {story.date}</p>
                <h3><Link href={contributionHref}>{localize(story.title, locale)}</Link></h3>
                <Link href={contributionHref}>{locale === "en" ? "View" : "Ver"} →</Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="page-shell community-profile-section community-profile-about" aria-labelledby="about-person">
        <h2 id="about-person">{labels.about}</h2>
        <div><p>{localize(person.introduction, locale)}</p></div>
      </section>
    </main>
  );
}
