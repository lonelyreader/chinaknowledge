import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPerson, kindLabels, localize, locales, people, requireLocale, stories, ui } from "@/content";
import { articlePath, cmsReadEnabled, getPublishedCMSPerson, getPublishedCMSPersonArticles } from "@/content/cms";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.flatMap((locale) => people.map((person) => ({ locale, slug: person.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  if (cmsReadEnabled()) {
    const person = await getPublishedCMSPerson(locale, slug);
    return person ? { title: person.name, description: person.identity } : {};
  }
  const person = getPerson(slug);
  return person ? { title: person.name, description: localize(person.identity, locale) } : {};
}

export default async function PersonPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  if (cmsReadEnabled()) {
    const [person, authored] = await Promise.all([
      getPublishedCMSPerson(locale, slug),
      getPublishedCMSPersonArticles(locale, slug),
    ]);
    if (!person) notFound();
    const copy = ui[locale];
    return (
      <main className="page-shell author-page">
        <header className="author-hero">
          <div className="author-portrait"><Image src={person.image.url} alt={person.image.alt} fill priority unoptimized sizes="(max-width: 767px) 100vw, 40vw" /></div>
          <div className="author-identity">
            <p className="meta">{person.city}</p>
            <h1>{person.name}</h1>
            <p className="author-role">{person.identity}</p>
            <p className="author-introduction">{person.introduction}</p>
            <ul className="topic-list">{person.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
            <div className="author-links">
              {person.links.map((link) => <a key={`${link.label}-${link.url}`} href={link.url} rel="noreferrer" target="_blank">{link.label} ↗</a>)}
            </div>
          </div>
        </header>
        <section className="author-work">
          <div className="section-heading"><h2>{copy.selectedWork}</h2></div>
          {authored.length ? (
            <div className="story-stream author-archive">
              {authored.map((article) => (
                <article className="story-line" key={article.slug}>
                  <p className="meta">{article.publishedAt.slice(0, 10)}</p>
                  <h3><Link href={articlePath(locale, article)}>{article.title}</Link></h3>
                  <span>{article.format === "guide" ? copy.guide : "Story"}</span>
                </article>
              ))}
            </div>
          ) : null}
        </section>
        <section className="discord-passage">
          <p className="meta">Discord</p>
          <h2>{copy.connect}</h2>
          <a className="button" href="https://discord.gg/CCUbfaRVd2" target="_blank" rel="noreferrer">Discord ↗</a>
        </section>
      </main>
    );
  }
  const person = getPerson(slug);
  if (!person) notFound();
  const copy = ui[locale];
  const authored = stories.filter((story) => story.authorSlug === person.slug);

  return (
    <main className="page-shell author-page">
      <header className="author-hero">
        <div className="author-portrait"><Image src={person.image} alt={`${locale === "en" ? "Portrait of" : "Retrato de"} ${person.name}`} fill priority sizes="(max-width: 767px) 100vw, 40vw" /></div>
        <div className="author-identity">
          <p className="meta">{localize(person.city, locale)}</p>
          <h1>{person.name}</h1>
          <p className="author-role">{localize(person.identity, locale)}</p>
          <p className="author-introduction">{localize(person.introduction, locale)}</p>
          <ul className="topic-list">{person.topics.map((topic) => <li key={topic.en}>{localize(topic, locale)}</li>)}</ul>
          <div className="author-links">
            {person.links.map((link) => <a key={link.label} href={link.href} rel="noreferrer" target="_blank">{link.label === "Website" && locale === "es" ? "Sitio web" : link.label === "Newsletter" && locale === "es" ? "Boletín" : link.label} ↗</a>)}
          </div>
        </div>
      </header>
      <section className="author-work">
        <div className="section-heading"><h2>{copy.selectedWork}</h2></div>
        <article className="author-feature">
          <p className="meta">{person.slug === "chen-rui" ? copy.guide : "Story"}</p>
          <h3><Link href={person.slug === "chen-rui" ? `/${locale}/guides/driving-in-shanghai` : `/${locale}/people/${person.slug}`}>{localize(person.contribution, locale)}</Link></h3>
        </article>
        {authored.length ? (
          <div className="story-stream author-archive">
            {authored.map((story) => <article className="story-line" key={story.slug}><p className="meta">{story.date}</p><h3>{localize(story.title, locale)}</h3><span>{kindLabels[locale][story.kind]}</span></article>)}
          </div>
        ) : null}
      </section>
      <section className="discord-passage">
        <p className="meta">Discord</p>
        <h2>{copy.connect}</h2>
        <a className="button" href="https://discord.gg/CCUbfaRVd2" target="_blank" rel="noreferrer">Discord ↗</a>
      </section>
    </main>
  );
}
