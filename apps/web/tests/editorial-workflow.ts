import "dotenv/config";

import assert from "node:assert/strict";
import { getPayload, type Payload } from "payload";

import config from "@payload-config";
import { buildPublicationSummary } from "@/cms/publication-summary";
import type { Article, User } from "@/payload-types";

const password = process.env.CMS_TEST_PASSWORD;
if (!password) throw new Error("CMS_TEST_PASSWORD is required for local fixture tests.");

const body: NonNullable<Article["body"]> = {
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "A fictional guide used to verify the editorial contract.",
            version: 1,
          },
        ],
        direction: null,
        format: "",
        indent: 0,
        textFormat: 0,
        textStyle: "",
        version: 1,
      },
    ],
    direction: null,
    format: "",
    indent: 0,
    version: 1,
  },
};

async function getOrCreateUser(
  payload: Payload,
  input: { email: string; displayName: string; role: User["role"] },
) {
  const existing = await payload.find({
    collection: "users",
    limit: 1,
    overrideAccess: true,
    where: { email: { equals: input.email } },
  });
  if (existing.docs[0]) return existing.docs[0];
  return payload.create({
    collection: "users",
    data: { ...input, password },
    overrideAccess: true,
  });
}

async function getOrCreatePerson(
  payload: Payload,
  editor: User,
  user: User,
  slug: string,
  name: string,
) {
  const existing = await payload.find({
    collection: "people",
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: slug } },
  });
  if (existing.docs[0]) return existing.docs[0];
  return payload.create({
    collection: "people",
    data: {
      city: "Shanghai",
      identity: "Fictional local contributor",
      introduction: "A fictional profile used only for local workflow verification.",
      languages: ["en", "es"],
      name,
      profileStatus: "public",
      slug,
      user: user.id,
    },
    overrideAccess: false,
    user: editor,
  });
}

async function removeAcceptanceArticles(payload: Payload) {
  const articles = await payload.find({
    collection: "articles",
    depth: 0,
    limit: 20,
    overrideAccess: true,
    where: { translationGroup: { equals: "acceptance-driving-shanghai" } },
  });
  for (const article of articles.docs) {
    await payload.delete({
      collection: "workflow-events",
      overrideAccess: true,
      where: { article: { equals: article.id } },
    });
    await payload.delete({ collection: "articles", id: article.id, overrideAccess: true });
  }
}

async function expectRejected(action: () => Promise<unknown>, label: string) {
  let rejected = false;
  try {
    await action();
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true, label);
}

async function main() {
  const payload = await getPayload({ config });

  const superAdmin = await getOrCreateUser(payload, {
    displayName: "Local Super Admin",
    email: "super-admin@china-in-fact.test",
    role: "super_admin",
  });
  const editor = await getOrCreateUser(payload, {
    displayName: "Local Editor",
    email: "editor@china-in-fact.test",
    role: "editor",
  });
  const author = await getOrCreateUser(payload, {
    displayName: "Chen Rui",
    email: "chen-rui@china-in-fact.test",
    role: "author",
  });
  const otherAuthor = await getOrCreateUser(payload, {
    displayName: "Other Author",
    email: "other-author@china-in-fact.test",
    role: "author",
  });

  const person = await getOrCreatePerson(payload, editor, author, "chen-rui", "Chen Rui");
  const otherPerson = await getOrCreatePerson(
    payload,
    editor,
    otherAuthor,
    "other-author",
    "Other Author",
  );
  assert.ok(otherPerson.id);

  const topicResult = await payload.find({
    collection: "taxonomies",
    limit: 1,
    overrideAccess: true,
    where: { and: [{ dimension: { equals: "topic" } }, { slug: { equals: "mobility" } }] },
  });
  const topic =
    topicResult.docs[0] ??
    (await payload.create({
      collection: "taxonomies",
      data: { dimension: "topic", name: "Mobility", slug: "mobility" },
      overrideAccess: false,
      user: editor,
    }));

  await removeAcceptanceArticles(payload);

  const english = await payload.create({
    collection: "articles",
    data: {
      author: person.id,
      body,
      format: "guide",
      freshnessDate: "2026-07-27T00:00:00.000Z",
      locale: "en",
      owner: author.id,
      slug: "driving-in-shanghai",
      sourceNotes: [
        {
          check: "Fictional source note for local contract testing.",
          label: "Local fixture",
        },
      ],
      summary: "A fictional local guide for the editorial acceptance flow.",
      title: "Driving in Shanghai: licences, permits and the first week",
      topics: [topic.id],
      translationGroup: "acceptance-driving-shanghai",
    },
    draft: true,
    overrideAccess: false,
    user: author,
  });
  assert.equal(english.workflowStatus, "draft");
  assert.equal(english._status, "draft");

  await payload.create({
    collection: "articles",
    data: {
      author: person.id,
      body,
      format: "guide",
      freshnessDate: "2026-07-27T00:00:00.000Z",
      locale: "es",
      owner: author.id,
      slug: "conducir-en-shanghai",
      sourceNotes: [
        {
          check: "Nota ficticia para una prueba local.",
          label: "Fixture local",
        },
      ],
      summary: "Una guía local ficticia para probar el flujo editorial.",
      title: "Conducir en Shanghái: permisos y la primera semana",
      topics: [topic.id],
      translationGroup: "acceptance-driving-shanghai",
    },
    draft: true,
    overrideAccess: false,
    user: editor,
  });

  const otherAuthorDraft = await payload.create({
    collection: "articles",
    data: {
      author: otherPerson.id,
      body,
      format: "guide",
      locale: "en",
      owner: otherAuthor.id,
      slug: "other-author-private-draft",
      sourceNotes: [
        {
          check: "Fictional private source note.",
          label: "Private local fixture",
        },
      ],
      summary: "A fictional private draft owned by another author.",
      title: "Another author's private draft",
      translationGroup: "acceptance-driving-shanghai",
    },
    draft: true,
    overrideAccess: false,
    user: otherAuthor,
  });

  const hiddenOtherDraft = await payload.find({
    collection: "articles",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    user: author,
    where: { id: { equals: otherAuthorDraft.id } },
  });
  assert.equal(hiddenOtherDraft.docs.length, 0);

  const submitted = await payload.update({
    collection: "articles",
    id: english.id,
    data: { workflowStatus: "submitted" },
    draft: true,
    overrideAccess: false,
    user: author,
  });
  assert.equal(submitted.workflowStatus, "submitted");

  await expectRejected(
    () =>
      payload.update({
        collection: "articles",
        id: english.id,
        data: { title: "Edit after submission" },
        draft: true,
        overrideAccess: false,
        user: author,
      }),
    "An author must not edit a submitted article.",
  );

  await expectRejected(
    () =>
      payload.update({
        collection: "articles",
        id: english.id,
        data: { title: "Unauthorized edit" },
        draft: true,
        overrideAccess: false,
        user: otherAuthor,
      }),
    "Another author must not update this article.",
  );

  await expectRejected(
    () =>
      payload.update({
        collection: "articles",
        id: english.id,
        data: { workflowStatus: "public" },
        overrideAccess: false,
        user: author,
      }),
    "An author must not publish.",
  );

  const inReview = await payload.update({
    collection: "articles",
    id: english.id,
    data: { assignedEditor: editor.id, workflowStatus: "in_review" },
    draft: true,
    overrideAccess: false,
    user: editor,
  });
  assert.equal(inReview.workflowStatus, "in_review");

  const changesRequested = await payload.update({
    collection: "articles",
    id: english.id,
    data: {
      editorComments: [
        {
          anchor: "Opening paragraph",
          createdBy: editor.id,
          message: "Clarify that this is a fictional acceptance fixture.",
          resolved: false,
        },
      ],
      workflowStatus: "changes_requested",
    },
    draft: true,
    overrideAccess: false,
    user: editor,
  });
  assert.equal(changesRequested.workflowStatus, "changes_requested");

  const resubmitted = await payload.update({
    collection: "articles",
    id: english.id,
    data: {
      summary: "A clearly fictional local guide for the editorial acceptance flow.",
      workflowStatus: "submitted",
    },
    draft: true,
    overrideAccess: false,
    user: author,
  });
  assert.equal(resubmitted.workflowStatus, "submitted");

  await payload.update({
    collection: "articles",
    id: english.id,
    data: { workflowStatus: "in_review" },
    draft: true,
    overrideAccess: false,
    user: editor,
  });
  const approved = await payload.update({
    collection: "articles",
    id: english.id,
    data: { workflowStatus: "approved" },
    draft: true,
    overrideAccess: false,
    user: editor,
  });
  assert.equal(approved.workflowStatus, "approved");

  const publicationSummary = buildPublicationSummary(
    await payload.findByID({
      collection: "articles",
      depth: 2,
      draft: true,
      id: english.id,
      overrideAccess: false,
      user: editor,
    }),
  );
  assert.deepEqual(publicationSummary, {
    author: "Chen Rui",
    classification: "Mobility",
    freshness: "2026-07-27",
    language: "English",
    object: "Guide",
    sources: "Local fixture",
    title: "Driving in Shanghai: licences, permits and the first week",
    url: "/en/guides/driving-in-shanghai",
  });

  await expectRejected(
    () =>
      payload.update({
        collection: "articles",
        id: english.id,
        data: { workflowStatus: "public" },
        overrideAccess: false,
        user: editor,
      }),
    "Approval must not publish without a separate confirmation.",
  );

  const published = await payload.update({
    collection: "articles",
    id: english.id,
    context: { publicationConfirmed: true },
    data: { workflowStatus: "public" },
    overrideAccess: false,
    user: editor,
  });
  assert.equal(published.workflowStatus, "public");
  assert.equal(published._status, "published");

  const englishPublic = await payload.find({
    collection: "articles",
    depth: 0,
    limit: 10,
    overrideAccess: false,
    where: {
      and: [
        { locale: { equals: "en" } },
        { slug: { equals: "driving-in-shanghai" } },
      ],
    },
  });
  assert.equal(englishPublic.docs.length, 1);
  assert.equal(englishPublic.docs[0]?.owner, undefined);
  assert.equal(englishPublic.docs[0]?.sourceNotes?.length, 1);
  assert.equal(englishPublic.docs[0]?.sourceNotes?.[0]?.label, "Local fixture");
  assert.equal(englishPublic.docs[0]?.sourceNotes?.[0]?.check, undefined);
  assert.deepEqual(englishPublic.docs[0]?.editorComments, []);
  assert.equal(englishPublic.docs[0]?.workflowStatus, undefined);
  assert.equal(englishPublic.docs[0]?.assignedEditor, undefined);

  const spanishPublic = await payload.find({
    collection: "articles",
    depth: 0,
    limit: 10,
    overrideAccess: false,
    where: {
      and: [
        { locale: { equals: "es" } },
        { translationGroup: { equals: "acceptance-driving-shanghai" } },
      ],
    },
  });
  assert.equal(spanishPublic.docs.length, 0);

  const archived = await payload.update({
    collection: "articles",
    id: english.id,
    data: { _status: "draft", workflowStatus: "archived" },
    overrideAccess: false,
    user: editor,
  });
  assert.equal(archived.workflowStatus, "archived");
  assert.equal(archived._status, "draft");

  const withdrawnPublic = await payload.find({
    collection: "articles",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: "driving-in-shanghai" } },
  });
  assert.equal(withdrawnPublic.docs.length, 0);

  for (const workflowStatus of ["draft", "in_review", "approved"] as const) {
    await payload.update({
      collection: "articles",
      id: english.id,
      data: { workflowStatus },
      draft: true,
      overrideAccess: false,
      user: editor,
    });
  }

  const republished = await payload.update({
    collection: "articles",
    id: english.id,
    context: { publicationConfirmed: true },
    data: { workflowStatus: "public" },
    overrideAccess: false,
    user: editor,
  });
  assert.equal(republished.workflowStatus, "public");
  assert.equal(republished._status, "published");

  await payload.update({
    collection: "users",
    id: editor.id,
    data: { role: "super_admin" },
    overrideAccess: false,
    user: editor,
  });
  const unchangedEditor = await payload.findByID({
    collection: "users",
    id: editor.id,
    overrideAccess: true,
  });
  assert.equal(unchangedEditor.role, "editor");

  const promotedOtherAuthor = await payload.update({
    collection: "users",
    id: otherAuthor.id,
    data: { role: "editor" },
    overrideAccess: false,
    user: superAdmin,
  });
  assert.equal(promotedOtherAuthor.role, "editor");
  await payload.update({
    collection: "users",
    id: otherAuthor.id,
    data: { role: "author" },
    overrideAccess: false,
    user: superAdmin,
  });

  const events = await payload.find({
    collection: "workflow-events",
    limit: 50,
    overrideAccess: true,
    where: { article: { equals: english.id } },
  });
  assert.ok(events.docs.length >= 12);
  assert.equal(superAdmin.role, "super_admin");

  console.log(
    JSON.stringify(
      {
        anonymousEnglish: englishPublic.docs.length,
        anonymousSpanish: spanishPublic.docs.length,
        anonymousWithdrawn: withdrawnPublic.docs.length,
        authorSeesOtherDraft: hiddenOtherDraft.docs.length,
        articleID: english.id,
        checks: "PASS",
        workflowEvents: events.docs.length,
      },
      null,
      2,
    ),
  );
  await payload.destroy();
}

await main();
process.exit(0);
