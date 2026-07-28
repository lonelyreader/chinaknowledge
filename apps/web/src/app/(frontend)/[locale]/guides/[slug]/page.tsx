import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CMSRichText } from "@/components/CMSRichText";
import { getGuide, getPerson, guides, localize, locales, requireLocale, ui } from "@/content";
import { articlePath, cmsReadEnabled, getPublishedCMSGuide, resolvePublishedCMSArticle } from "@/content/cms";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.flatMap((locale) => guides.map((guide) => ({ locale, slug: guide.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const cmsGuide = await getPublishedCMSGuide(locale, slug);
  if (cmsGuide) return { title: cmsGuide.title, description: cmsGuide.summary };
  if (cmsReadEnabled()) return {};
  const guide = getGuide(slug);
  if (!guide) return {};
  return { title: localize(guide.title, locale), description: localize(guide.summary, locale) };
}

export default async function GuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const resolution = cmsReadEnabled() ? await resolvePublishedCMSArticle(locale, slug) : null;
  const cmsGuide = resolution?.article.format === "guide" ? resolution.article : null;
  if (cmsReadEnabled()) {
    if (!cmsGuide) notFound();
    if (resolution && resolution.canonicalSlug !== slug) redirect(articlePath(locale, cmsGuide));
    const copy = ui[locale];
    const reviewed = cmsGuide.freshnessDate?.slice(0, 10);
    if (!reviewed) notFound();

    return (
      <main>
        <article className="guide-page page-shell">
          <header className="guide-header">
            <p className="meta">{copy.guide}{cmsGuide.purposes[0] ? ` · ${cmsGuide.purposes[0]}` : ""}</p>
            <h1>{cmsGuide.title}</h1>
            <p className="dek">{cmsGuide.summary}</p>
            <div className="guide-byline">
              <Image src={cmsGuide.author.image.url} alt={cmsGuide.author.image.alt} width={72} height={72} unoptimized />
              <div>
                <span className="meta">{copy.writtenBy}</span>
                <Link href={`/${locale}/people/${cmsGuide.author.slug}`}>{cmsGuide.author.name}</Link>
                <span>{cmsGuide.author.identity}, {cmsGuide.author.city}</span>
              </div>
              <p><span className="meta">{copy.reviewed}</span><br />{reviewed}</p>
            </div>
          </header>
          <figure className="guide-image">
            <Image src={cmsGuide.coverImage.url} alt={cmsGuide.coverImage.alt} fill priority unoptimized sizes="(max-width: 767px) 100vw, 1200px" />
          </figure>
          <div className="guide-body">
            <aside className="guide-aside">
              <p className="meta">{locale === "en" ? "Current" : "Vigente"}<br />{reviewed}</p>
            </aside>
            <div className="prose">
              <CMSRichText data={cmsGuide.body} />
              <section className="source-notes">
                <h2>{copy.sources}</h2>
                <ol>
                  {cmsGuide.sources.map((source) => (
                    <li key={`${source.label}-${source.url ?? "local"}`}>
                      {source.url ? <a href={source.url}>{source.label}</a> : source.label}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
          <section className="author-passage">
            <Image src={cmsGuide.author.image.url} alt={cmsGuide.author.image.alt} width={180} height={180} unoptimized />
            <div>
              <p className="meta">{copy.aboutAuthor}</p>
              <h2>{cmsGuide.author.name}</h2>
              <p>{cmsGuide.author.introduction}</p>
              <Link className="text-link" href={`/${locale}/people/${cmsGuide.author.slug}`}>{copy.contributions} →</Link>
            </div>
          </section>
        </article>
      </main>
    );
  }
  const guide = getGuide(slug);
  if (!guide) notFound();
  const author = getPerson(guide.authorSlug)!;
  const copy = ui[locale];

  return (
    <main>
      <article className="guide-page page-shell">
        <header className="guide-header">
          <p className="meta">{copy.guide} · {localize(guide.purpose, locale)}</p>
          <h1>{localize(guide.title, locale)}</h1>
          <p className="dek">{localize(guide.summary, locale)}</p>
          <div className="guide-byline">
            <Image src={author.image} alt={`${locale === "en" ? "Portrait of" : "Retrato de"} ${author.name}`} width={72} height={72} />
            <div>
              <span className="meta">{copy.writtenBy}</span>
              <Link href={`/${locale}/people/${author.slug}`}>{author.name}</Link>
              <span>{localize(author.identity, locale)}, {localize(author.city, locale)}</span>
            </div>
            <p><span className="meta">{copy.reviewed}</span><br />{guide.reviewed}</p>
          </div>
        </header>
        <figure className="guide-image">
          <Image src="/images/fixtures/shanghai-morning.webp" alt={locale === "en" ? "Residents walking and cycling along a Shanghai neighborhood street" : "Vecinos caminando y en bicicleta por una calle de barrio en Shanghái"} fill priority sizes="(max-width: 767px) 100vw, 1200px" />
        </figure>
        <div className="guide-body">
          <aside className="guide-aside">
            <p className="meta">{locale === "en" ? "Current" : "Vigente"}<br />{guide.reviewed}</p>
          </aside>
          <div className="prose">
            {guide.sections.map((section) => (
              <section key={section.heading.en}>
                <h2>{localize(section.heading, locale)}</h2>
                {section.body.map((paragraph) => <p key={paragraph.en}>{localize(paragraph, locale)}</p>)}
              </section>
            ))}
            <section className="source-notes">
              <h2>{copy.sources}</h2>
              <ol>{guide.sources.map((source) => <li key={source.en}>{localize(source, locale)}</li>)}</ol>
            </section>
          </div>
        </div>
        <section className="author-passage">
          <Image src={author.image} alt={`${locale === "en" ? "Portrait of" : "Retrato de"} ${author.name}`} width={180} height={180} />
          <div>
            <p className="meta">{copy.aboutAuthor}</p>
            <h2>{author.name}</h2>
            <p>{localize(author.introduction, locale)}</p>
            <Link className="text-link" href={`/${locale}/people/${author.slug}`}>{copy.contributions} →</Link>
          </div>
        </section>
      </article>
    </main>
  );
}
