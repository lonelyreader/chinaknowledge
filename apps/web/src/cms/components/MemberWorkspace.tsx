import type { ServerProps } from "payload";
import Link from "next/link";

import type { Article, Person, User } from "@/payload-types";

function relationID(value: Article["owner"]) {
  return value && typeof value === "object" ? value.id : value;
}

function articleURL(article: Article) {
  return `/admin/collections/articles/${article.id}`;
}

function workURL(userID: number | string) {
  return `/admin/collections/articles?where[owner][equals]=${encodeURIComponent(String(userID))}`;
}

function curationURL(status: Article["curationStatus"]) {
  return `/admin/collections/articles?where[publicationStatus][equals]=published&where[curationStatus][equals]=${status}`;
}

function curationLabel(status: Article["curationStatus"]) {
  if (status === "curated") return "Site selected";
  if (status === "needs_recheck") return "Needs recheck";
  if (status === "not_selected") return "Not selected";
  return status ? status.replaceAll("_", " ") : "Not selected";
}

function nextAction(article: Article) {
  if (article.publicationStatus === "draft") return "Continue";
  if (article.publicationStatus === "withdrawn") return "Republish";
  return "Edit";
}

export async function MemberWorkspace({ payload, user: untypedUser }: ServerProps) {
  const user = untypedUser as User | undefined;
  if (!user) return null;

  const [people, work] = await Promise.all([
    payload.find({
      collection: "people",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { user: { equals: user.id } },
    }),
    payload.find({
      collection: "articles",
      depth: 0,
      draft: true,
      limit: 5,
      overrideAccess: true,
      pagination: false,
      sort: "-updatedAt",
      where: { owner: { equals: user.id } },
    }),
  ]);
  const person = people.docs[0] as Person | undefined;
  const editorial = user.role === "editor" || user.role === "super_admin";
  const curationCounts = editorial
    ? await Promise.all(["not_selected", "needs_recheck", "selected", "editing", "curated", "removed"].map(async (status) => ({
        count: await payload.count({
          collection: "articles",
          overrideAccess: true,
          where: {
            and: [
              { publicationStatus: { equals: "published" } },
              { curationStatus: { equals: status } },
            ],
          },
        }),
        status: status as Article["curationStatus"],
      })))
    : [];

  return (
    <section
      className="member-workspace"
      style={{ gridColumn: "1 / -1", minWidth: "min(64rem, calc(100vw - 4rem))", width: "100%" }}
    >
      <div className="member-workspace__header">
        <h1>My work</h1>
        <div className="member-workspace__actions">
          <Link className="btn btn--style-secondary btn--size-small" href={workURL(user.id)}>All work</Link>
          <Link className="btn btn--style-primary btn--size-small" href="/admin/collections/articles/create">New article</Link>
          {person ? (
            <Link className="btn btn--style-secondary btn--size-small" href={`/admin/collections/people/${person.id}`}>My profile</Link>
          ) : null}
        </div>
      </div>

      {work.docs.length ? (
        <div className="member-workspace__list">
          {work.docs.map((article) => relationID(article.owner) === user.id ? (
            <Link className="member-workspace__item" href={articleURL(article)} key={article.id}>
              <strong>{article.title || "Untitled"}</strong>
              <span>{article.locale?.toUpperCase()} · {article.publicationStatus === "published" ? "Public" : article.publicationStatus === "withdrawn" ? "Withdrawn" : "Draft"} · {curationLabel(article.curationStatus)}</span>
              <span>{new Date(article.updatedAt).toLocaleDateString("en-CA")} · {nextAction(article)}</span>
            </Link>
          ) : null)}
        </div>
      ) : null}

      {editorial ? (
        <div className="member-workspace__curation">
          <h2>Curation</h2>
          <div className="member-workspace__queues">
            {curationCounts.map(({ count, status }) => (
              <Link href={curationURL(status)} key={status}>
                <strong>{count.totalDocs}</strong>
                <span>{curationLabel(status)}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
