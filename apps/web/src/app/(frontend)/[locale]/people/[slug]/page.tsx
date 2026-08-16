import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { CMSRichText } from "@/components/CMSRichText";
import { getPerson, kindLabels, localize, locales, people, requireLocale, stories, ui } from "@/content";
import { articlePath, cmsReadEnabled, getPreviewCMSPerson, getPublishedCMSPerson, getPublishedCMSPersonArticles } from "@/content/cms";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
    const copy = ui[locale];
    const selected = authored.filter((article) => article.curationStatus === "curated");
    const otherPosts = authored.filter((article) => article.curationStatus !== "curated");
    const discord = person.links.find((link) => link.type === "discord");
    const primaryLinks = person.links.filter((link) => link.type !== "discord");
    // Split the shared contact line so the closing "Discord" word carries the link.
    const discordAnchorAt = person.discordLine?.lastIndexOf("Discord") ?? -1;
    return (
      <main className="page-shell person-letter">
        {person.hanziName ? <span className="person-letter-sidemark" aria-hidden="true">{person.hanziName}</span> : null}
        <header className="person-letterhead">
          <div className="person-letter-portrait"><Image src={person.image.url} alt={person.image.alt} fill priority unoptimized sizes="(max-width: 767px) 40vw, 180px" /></div>
          <div className="person-letter-title">
            <h1>{person.name}</h1>
            {primaryLinks.length ? (
              <div className="person-letter-links">
                {primaryLinks.map((link) => <a key={`${link.label}-${link.url}`} href={link.url} rel="noreferrer" target="_blank">{link.label} ↗</a>)}
              </div>
            ) : null}
          </div>
          <p className="meta person-letter-identity">{person.identity} · {person.city}</p>
          {person.topics.length ? <ul className="topic-list person-letter-topics">{person.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul> : null}
          {person.epithet ? <p className="person-letter-verdict">{person.epithet}</p> : null}
        </header>
        <section className="person-letter-bio">
          {person.editorialBio ? <CMSRichText data={person.editorialBio} /> : <p>{person.introduction}</p>}
        </section>
        {person.quote ? <blockquote className="person-letter-quote"><p>{person.quote}</p></blockquote> : null}
        {selected.length ? <section className="person-letter-work">
          <div className="section-heading"><h2>{copy.selectedWork}</h2></div>
          <div className="story-stream person-letter-archive">
            {selected.map((article) => (
              <article className="story-line" key={article.slug}>
                <p className="meta">{article.publishedAt.slice(0, 10)}</p>
                <h3><Link href={articlePath(locale, article)}>{article.title}</Link></h3>
                <span>{article.format === "guide" ? copy.guide : "Story"}</span>
              </article>
            ))}
          </div>
        </section> : null}
        {otherPosts.length ? <section className="person-letter-work">
          <div className="section-heading"><h2>{locale === "en" ? "Posts" : "Publicaciones"}</h2></div>
            <div className="story-stream person-letter-archive">
              {otherPosts.map((article) => (
                <article className="story-line" key={article.slug}>
                  <p className="meta">{article.publishedAt.slice(0, 10)}</p>
                  <h3><Link href={articlePath(locale, article)}>{article.title}</Link></h3>
                  <span>{locale === "en" ? "Post" : "Publicación"}</span>
                </article>
              ))}
            </div>
        </section> : null}
        {person.canHelpWith.length ? <section className="person-letter-help">
          <div className="section-heading"><h2>{locale === "en" ? "Can help with" : "Puede ayudar con"}</h2></div>
          <ul>
            {person.canHelpWith.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section> : null}
        {discord && person.discordLine ? (
          <p className="person-letter-discord">
            {discordAnchorAt >= 0 ? person.discordLine.slice(0, discordAnchorAt) : `${person.discordLine} `}
            <a href={discord.url} rel="noreferrer" target="_blank">Discord ↗</a>
          </p>
        ) : null}
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
