import Image from "next/image";
import Link from "next/link";

import type { PublishedCMSByline } from "@/content/cms";
import type { Locale } from "@/content/types";

export function ArticleBylineLink({
  author,
  className,
  locale,
}: {
  author: PublishedCMSByline;
  className?: string;
  locale: Locale;
}) {
  return (
    <Link className={className} href={author.kind === "person" ? `/${locale}/people/${author.slug}` : `/${locale}/about`}>
      {author.name}
    </Link>
  );
}

export function HeroArticleByline({ author, locale }: { author: PublishedCMSByline; locale: Locale }) {
  return (
    <div className={`hero-byline hero-byline--${author.kind}`}>
      {author.kind === "person" ? (
        <Image src={author.image.url} alt={author.image.alt} width={64} height={64} unoptimized />
      ) : null}
      <div>
        <ArticleBylineLink author={author} locale={locale} />
        {author.kind === "person" ? <span>{author.identity}, {author.city}</span> : null}
      </div>
    </div>
  );
}

export function GuideArticleByline({
  author,
  date,
  label,
  locale,
}: {
  author: PublishedCMSByline;
  date: React.ReactNode;
  label: string;
  locale: Locale;
}) {
  return (
    <div className={`guide-byline guide-byline--${author.kind}`}>
      {author.kind === "person" ? (
        <Image src={author.image.url} alt={author.image.alt} width={72} height={72} unoptimized />
      ) : null}
      <div>
        <span className="meta">{label}</span>
        <ArticleBylineLink author={author} locale={locale} />
        {author.kind === "person" ? <span>{author.identity}, {author.city}</span> : null}
      </div>
      <p>{date}</p>
    </div>
  );
}
