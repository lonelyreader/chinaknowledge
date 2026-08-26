import Image from "next/image";
import Link from "next/link";

type PersonConnectionRowProps = {
  canHelpWith?: string[];
  city: string;
  currentWork?: { href: string; title: string };
  currentWorkLabel: string;
  identity: string;
  image: { alt: string; src: string; unoptimized?: boolean };
  languages?: string[];
  name: string;
  profileHref: string;
  tagsLabel: string;
  topics?: string[];
  viewLabel: string;
};

export function PersonConnectionRow({
  canHelpWith = [],
  city,
  currentWork,
  currentWorkLabel,
  identity,
  image,
  languages = [],
  name,
  profileHref,
  tagsLabel,
  topics = [],
  viewLabel,
}: PersonConnectionRowProps) {
  const tags = canHelpWith.length ? canHelpWith.slice(0, 2) : topics.slice(0, 2);

  return (
    <article className="community-person-row">
      <Link className="community-person-row__portrait" href={profileHref} aria-label={`${viewLabel} ${name}`}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          unoptimized={image.unoptimized}
          sizes="64px"
        />
      </Link>
      <div className="community-person-row__identity">
        <h3><Link href={profileHref}>{name}</Link></h3>
        <p>{identity}</p>
        <span>{city}{languages.length ? ` · ${languages.join(" / ").toUpperCase()}` : ""}</span>
      </div>
      {currentWork ? (
        <div className="community-person-row__work">
          <span>{currentWorkLabel}</span>
          <Link href={currentWork.href}>{currentWork.title}</Link>
        </div>
      ) : null}
      {tags.length ? (
        <div className="community-person-row__tags" aria-label={tagsLabel}>
          {tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
      ) : null}
      <Link className="community-person-row__open" href={profileHref} aria-label={`${viewLabel} ${name}`}>→</Link>
    </article>
  );
}
