import { Button } from "@payloadcms/ui";
import Link from "next/link";
import type { WidgetServerProps } from "payload";

import type { Article, Person, User, WorkflowEvent } from "@/payload-types";

function articleURL(article: Article) {
  return `/admin/collections/articles/${article.id}`;
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

function isEditorial(user: User) {
  return user.role === "editor" || user.role === "super_admin";
}

async function NeedsAttentionWidget({ req }: WidgetServerProps) {
  const user = req.user as User | undefined;
  if (!user || !isEditorial(user)) return null;
  const searchParams = new URL(req.url ?? "http://localhost/admin").searchParams;
  const localeFilter = searchParams.get("locale");
  const assigneeFilter = searchParams.get("assignee");

  const attention = await req.payload.find({
    collection: "articles",
    depth: 1,
    limit: 12,
    overrideAccess: true,
    pagination: false,
    sort: "-updatedAt",
    where: {
      and: [
        { publicationStatus: { equals: "published" } },
        {
          or: [
            { curationStatus: { equals: "not_selected" } },
            { curationStatus: { equals: "needs_recheck" } },
          ],
        },
        ...(localeFilter === "en" || localeFilter === "es" ? [{ locale: { equals: localeFilter } }] : []),
        ...(assigneeFilter === "mine" ? [{ assignedEditor: { equals: user.id } }] : []),
        ...(assigneeFilter === "unassigned" ? [{ assignedEditor: { exists: false } }] : []),
      ],
    },
  });
  const attentionEvents = attention.docs.length
    ? await req.payload.find({
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

  return (
    <section className="admin-widget" id="needs-attention">
      <header className="admin-widget__header">
        <h2>Needs attention</h2>
        <Button buttonStyle="secondary" el="link" margin={false} size="small" to="/admin/collections/articles?where[publicationStatus][equals]=published">All articles</Button>
      </header>
      <nav aria-label="Needs attention filters" className="admin-widget__filters">
        <Button buttonStyle={!localeFilter && !assigneeFilter ? "primary" : "secondary"} el="link" margin={false} size="small" to="/admin">All</Button>
        <Button buttonStyle={localeFilter === "en" ? "primary" : "secondary"} el="link" margin={false} size="small" to="/admin?locale=en">EN</Button>
        <Button buttonStyle={localeFilter === "es" ? "primary" : "secondary"} el="link" margin={false} size="small" to="/admin?locale=es">ES</Button>
        <Button buttonStyle={assigneeFilter === "mine" ? "primary" : "secondary"} el="link" margin={false} size="small" to="/admin?assignee=mine">Mine</Button>
        <Button buttonStyle={assigneeFilter === "unassigned" ? "primary" : "secondary"} el="link" margin={false} size="small" to="/admin?assignee=unassigned">Unassigned</Button>
      </nav>
      {attention.docs.length ? (
        <div className="admin-widget__list">
          {attention.docs.map((article) => {
            const event = latestEvents.get(String(article.id));
            return (
              <Link className="admin-widget__item" href={articleURL(article)} key={article.id}>
                <strong>{article.title || "Untitled"}</strong>
                <span>{article.locale?.toUpperCase()} · {authorName(article.author)} · {editorName(article.assignedEditor)}</span>
                <span>{event ? `${curationLabel(event.toStatus as Article["curationStatus"])} · ${new Date(event.occurredAt).toLocaleDateString("en-CA")}` : `Updated · ${new Date(article.updatedAt).toLocaleDateString("en-CA")}`} · {curationAction(article)}</span>
              </Link>
            );
          })}
        </div>
      ) : <p className="admin-widget__empty">Clear</p>}
    </section>
  );
}

async function MyWorkWidget({ req }: WidgetServerProps) {
  const user = req.user as User | undefined;
  if (!user) return null;

  const [people, work] = await Promise.all([
    req.payload.find({
      collection: "people",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { user: { equals: user.id } },
    }),
    req.payload.find({
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

  return (
    <section className="admin-widget" id="my-work">
      <header className="admin-widget__header">
        <h2>My work</h2>
        <div className="admin-widget__actions">
          <Button buttonStyle="secondary" el="link" margin={false} size="small" to={workURL(user.id)}>All work</Button>
          <Button buttonStyle="primary" el="link" margin={false} size="small" to="/admin/collections/articles/create">New article</Button>
          {person ? <Button buttonStyle="secondary" el="link" margin={false} size="small" to={`/admin/collections/people/${person.id}`}>My profile</Button> : null}
        </div>
      </header>
      {work.docs.length ? (
        <div className="admin-widget__list">
          {work.docs.map((article) => (
            <Link className="admin-widget__item" href={articleURL(article)} key={article.id}>
              <strong>{article.title || "Untitled"}</strong>
              <span>{article.locale?.toUpperCase()} · {article.publicationStatus === "published" ? "Public" : article.publicationStatus === "withdrawn" ? "Withdrawn" : "Draft"} · {curationLabel(article.curationStatus)}</span>
              <span>{new Date(article.updatedAt).toLocaleDateString("en-CA")} · {nextAction(article)}</span>
            </Link>
          ))}
        </div>
      ) : <p className="admin-widget__empty">No articles</p>}
    </section>
  );
}

async function CurationQueuesWidget({ req }: WidgetServerProps) {
  const user = req.user as User | undefined;
  if (!user || !isEditorial(user)) return null;

  const statuses: Article["curationStatus"][] = [
    "not_selected",
    "needs_recheck",
    "selected",
    "editing",
    "curated",
    "removed",
  ];
  const counts = await Promise.all(statuses.map(async (status) => ({
    count: await req.payload.count({
      collection: "articles",
      overrideAccess: true,
      where: {
        and: [
          { publicationStatus: { equals: "published" } },
          { curationStatus: { equals: status } },
        ],
      },
    }),
    status,
  })));

  return (
    <section className="admin-widget">
      <header className="admin-widget__header"><h2>Queues</h2></header>
      <div className="admin-widget__queues">
        {counts.map(({ count, status }) => (
          <Link href={curationURL(status)} key={status}>
            <strong>{count.totalDocs}</strong>
            <span>{curationLabel(status)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function WorkspaceWidget(props: WidgetServerProps) {
  const user = props.req.user as User | undefined;
  if (!user) return null;
  const editorial = isEditorial(user);

  return (
    <div className="admin-workspace">
      {editorial ? <NeedsAttentionWidget {...props} /> : null}
      <MyWorkWidget {...props} />
      {editorial ? <CurationQueuesWidget {...props} /> : null}
    </div>
  );
}
