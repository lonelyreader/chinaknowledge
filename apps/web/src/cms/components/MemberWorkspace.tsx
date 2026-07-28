import type { ServerProps } from "payload";
import Link from "next/link";

import type { Article, Person, User, WorkflowEvent } from "@/payload-types";
import { NewArticleStart } from "./NewArticleStart";

function relationID(value: Article["owner"]) {
  return value && typeof value === "object" ? value.id : value;
}

function articleURL(article: Article, mode: "creator" | "curation") {
  return `/admin/collections/articles/${article.id}?mode=${mode}`;
}

function workURL(userID: number | string) {
  return `/admin/collections/articles?where[owner][equals]=${encodeURIComponent(String(userID))}&where[title][exists]=true`;
}

function curationURL(status: Article["curationStatus"]) {
  return `/admin/collections/articles?where[publicationStatus][equals]=published&where[curationStatus][equals]=${status}`;
}

function curationLabel(status: Article["curationStatus"]) {
  if (status === "curated") return "Site selected";
  if (status === "editing") return "Editing";
  if (status === "needs_recheck") return "Needs recheck";
  if (status === "not_selected") return "Not selected";
  if (status === "removed") return "Removed";
  if (status === "selected") return "Selected";
  return "Not selected";
}

function nextAction(article: Article) {
  if (article.publicationStatus === "draft") return "Continue";
  if (article.publicationStatus === "withdrawn") return "Republish";
  return "Edit";
}

function editorName(value: Article["assignedEditor"]) {
  if (!value || typeof value !== "object") return "Unassigned";
  return value.displayName || value.email;
}

function authorName(value: Article["author"]) {
  if (!value || typeof value !== "object") return "Unknown";
  return value.name;
}

function curationAction(article: Article) {
  return article.curationStatus === "needs_recheck" ? "Review changes" : "Select";
}

export async function MemberWorkspace({ payload, searchParams, user: untypedUser }: ServerProps) {
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
      where: {
        and: [
          { owner: { equals: user.id } },
          { title: { exists: true } },
        ],
      },
    }),
  ]);
  const person = people.docs[0] as Person | undefined;
  const editorial = user.role === "editor" || user.role === "super_admin";
  const localeFilter = searchParams?.locale === "en" || searchParams?.locale === "es" ? searchParams.locale : null;
  const assigneeFilter = searchParams?.assignee === "mine" || searchParams?.assignee === "unassigned" ? searchParams.assignee : null;
  const attention = editorial
    ? await payload.find({
        collection: "articles",
        depth: 1,
        limit: 12,
        overrideAccess: true,
        pagination: false,
        sort: "-updatedAt",
        where: {
          and: [
            { publicationStatus: { equals: "published" } },
            { or: [
              { curationStatus: { equals: "not_selected" } },
              { curationStatus: { equals: "needs_recheck" } },
            ] },
            ...(localeFilter ? [{ locale: { equals: localeFilter } }] : []),
            ...(assigneeFilter === "mine" ? [{ assignedEditor: { equals: user.id } }] : []),
            ...(assigneeFilter === "unassigned" ? [{ assignedEditor: { exists: false } }] : []),
          ],
        },
      })
    : null;
  const attentionEvents = attention?.docs.length
    ? await payload.find({
        collection: "workflow-events",
        depth: 0,
        limit: 100,
        overrideAccess: true,
        pagination: false,
        sort: "-occurredAt",
        where: { article: { in: attention.docs.map((article) => article.id) } },
      })
    : null;
  const latestEvents = new Map<string, WorkflowEvent>();
  for (const event of attentionEvents?.docs ?? []) {
    const articleID = typeof event.article === "object" ? event.article.id : event.article;
    const key = String(articleID);
    if (!latestEvents.has(key)) latestEvents.set(key, event);
  }
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
      {editorial ? (
        <div className="member-workspace__attention">
          <div className="member-workspace__header">
            <h1>Needs attention</h1>
            <div className="member-workspace__filters">
              <Link href="/admin">All</Link>
              <Link href="/admin?locale=en">EN</Link>
              <Link href="/admin?locale=es">ES</Link>
              <Link href="/admin?assignee=mine">Mine</Link>
              <Link href="/admin?assignee=unassigned">Unassigned</Link>
            </div>
          </div>
          {attention?.docs.length ? (
            <div className="member-workspace__list">
              {attention.docs.map((article) => {
                const event = latestEvents.get(String(article.id));
                return (
                  <Link className="member-workspace__item member-workspace__item--attention" href={articleURL(article, "curation")} key={article.id}>
                    <strong>{article.title || "Untitled"}</strong>
                    <span>{article.locale?.toUpperCase()} · {authorName(article.author)} · {editorName(article.assignedEditor)}</span>
                    <span>{event ? `${curationLabel(event.toStatus as Article["curationStatus"])} · ${new Date(event.occurredAt).toLocaleDateString("en-CA")}` : `Updated · ${new Date(article.updatedAt).toLocaleDateString("en-CA")}`} · {curationAction(article)}</span>
                  </Link>
                );
              })}
            </div>
          ) : <p className="member-workspace__empty">Clear</p>}
        </div>
      ) : null}

      <div className="member-workspace__header">
        {editorial ? <h2>My work</h2> : <h1>My work</h1>}
        <div className="member-workspace__actions">
          <Link className="btn btn--style-secondary btn--size-small" href={workURL(user.id)}>All work</Link>
          <NewArticleStart />
          {person ? (
            <Link className="btn btn--style-secondary btn--size-small" href={`/admin/collections/people/${person.id}`}>My profile</Link>
          ) : null}
        </div>
      </div>

      {work.docs.length ? (
        <div className="member-workspace__list">
          {work.docs.map((article) => relationID(article.owner) === user.id ? (
            <Link className="member-workspace__item" href={articleURL(article, "creator")} key={article.id}>
              <strong>{article.title || "Untitled"}</strong>
              <span>{article.locale?.toUpperCase()} · {article.publicationStatus === "published" ? "Public" : article.publicationStatus === "withdrawn" ? "Withdrawn" : "Draft"} · {curationLabel(article.curationStatus)}</span>
              <span>{new Date(article.updatedAt).toLocaleDateString("en-CA")} · {nextAction(article)}</span>
            </Link>
          ) : null)}
        </div>
      ) : null}

      {editorial ? (
        <div className="member-workspace__curation">
          <h2>Queues</h2>
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
