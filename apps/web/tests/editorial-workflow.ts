import "dotenv/config";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPayload, type Payload } from "payload";

import config from "@payload-config";
import { buildPublicationSummary } from "@/cms/publication-summary";
import type { Article, Media, User } from "@/payload-types";
import { stableWeeklyPeople } from "@/content/stable-weekly-people";

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
  portrait: Media,
  slug: string,
  name: string,
) {
  const existing = await payload.find({
    collection: "people",
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: slug } },
  });
  if (existing.docs[0]) {
    return payload.update({
      collection: "people",
      id: existing.docs[0].id,
      data: {
        authorApprovalRecordedAt: "2026-07-27T00:00:00.000Z",
        city: "Shanghai",
        identity: "Fictional local contributor",
        introduction: "A fictional profile used only for local workflow verification.",
        languages: ["en", "es"],
        portrait: portrait.id,
        profileStatus: "draft",
      },
      overrideAccess: false,
      user: editor,
    });
  }
  return payload.create({
    collection: "people",
    data: {
      city: "Shanghai",
      identity: "Fictional local contributor",
      introduction: "A fictional profile used only for local workflow verification.",
      languages: ["en", "es"],
      name,
      authorApprovalRecordedAt: "2026-07-27T00:00:00.000Z",
      portrait: portrait.id,
      profileStatus: "draft",
      slug,
      user: user.id,
    },
    overrideAccess: false,
    user: editor,
  });
}

async function getOrCreateMedia(payload: Payload, editor: User) {
  const existing = await payload.find({
    collection: "media",
    limit: 1,
    overrideAccess: true,
    where: { alt: { equals: "Fictional acceptance portrait" } },
  });
  if (existing.docs[0]) {
    return payload.update({
      collection: "media",
      id: existing.docs[0].id,
      data: { publicUseApprovedAt: "2026-07-27T00:00:00.000Z" },
      overrideAccess: false,
      user: editor,
    });
  }
  const data = await readFile(path.resolve(process.cwd(), "public/images/fixtures/portrait-a-00.webp"));
  return payload.create({
    collection: "media",
    data: {
      alt: "Fictional acceptance portrait",
      publicUseApprovedAt: "2026-07-27T00:00:00.000Z",
    },
    file: {
      data,
      mimetype: "image/webp",
      name: "fictional-acceptance-portrait.webp",
      size: data.byteLength,
    },
    overrideAccess: false,
    user: editor,
  });
}

async function getOrCreateUnapprovedMedia(payload: Payload, author: User) {
  const existing = await payload.find({
    collection: "media",
    limit: 1,
    overrideAccess: true,
    where: { alt: { equals: "Unapproved fictional portrait" } },
  });
  if (existing.docs[0]) return existing.docs[0];
  const data = await readFile(path.resolve(process.cwd(), "public/images/fixtures/portrait-b-00.webp"));
  return payload.create({
    collection: "media",
    data: { alt: "Unapproved fictional portrait" },
    file: {
      data,
      mimetype: "image/webp",
      name: "unapproved-fictional-portrait.webp",
      size: data.byteLength,
    },
    overrideAccess: false,
    user: author,
  });
}

async function removePersonRevisions(payload: Payload, personID: number | string) {
  await payload.delete({
    collection: "person-revisions",
    overrideAccess: true,
    where: { person: { equals: personID } },
  });
}

async function removeAcceptanceArticles(payload: Payload) {
  const articles = await payload.find({
    collection: "articles",
    depth: 0,
    limit: 20,
    overrideAccess: true,
    where: {
      translationGroup: {
        in: ["acceptance-driving-shanghai", "acceptance-shanghai-morning-routes"],
      },
    },
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

async function removeAcceptancePlaces(payload: Payload) {
  const places = await payload.find({
    collection: "places",
    depth: 0,
    limit: 20,
    overrideAccess: true,
    where: { translationGroup: { in: ["acceptance-shanghai", "acceptance-unlinked-place"] } },
  });
  for (const place of places.docs) {
    await payload.delete({ collection: "places", id: place.id, overrideAccess: true });
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

function relationID(value: number | string | { id: number | string } | null | undefined) {
  return value && typeof value === "object" ? value.id : value;
}

const scalePersonSlugs = Array.from(
  { length: 24 },
  (_, index) => `acceptance-person-${String(index + 1).padStart(2, "0")}`,
);

async function advanceScaleArticle(
  payload: Payload,
  editor: User,
  article: Article,
) {
  let current = article;
  if (current.workflowStatus === "archived") {
    current = await payload.update({
      collection: "articles",
      id: current.id,
      data: { workflowStatus: "draft" },
      draft: true,
      overrideAccess: false,
      user: editor,
    });
  }
  if (["draft", "submitted", "changes_requested"].includes(current.workflowStatus)) {
    current = await payload.update({
      collection: "articles",
      id: current.id,
      data: { workflowStatus: "in_review" },
      draft: true,
      overrideAccess: false,
      user: editor,
    });
  }
  if (current.workflowStatus === "in_review") {
    current = await payload.update({
      collection: "articles",
      id: current.id,
      data: { workflowStatus: "approved" },
      draft: true,
      overrideAccess: false,
      user: editor,
    });
  }
  if (current.workflowStatus === "approved") {
    current = await payload.update({
      collection: "articles",
      id: current.id,
      context: { publicationConfirmed: true },
      data: { workflowStatus: "public" },
      overrideAccess: false,
      user: editor,
    });
  }
  assert.equal(current.workflowStatus, "public");
  assert.equal(current._status, "published");
  return current;
}

async function ensureScalePeople(
  payload: Payload,
  editor: User,
  portrait: Media,
  topicID: number,
  geographyID: number,
) {
  for (const [index, slug] of scalePersonSlugs.entries()) {
    const sequence = index + 1;
    const user = await getOrCreateUser(payload, {
      displayName: `Acceptance Person ${String(sequence).padStart(2, "0")}`,
      email: `${slug}@china-in-fact.test`,
      role: "author",
    });
    const peopleResult = await payload.find({
      collection: "people",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: slug } },
    });
    let scalePerson = peopleResult.docs[0];
    if (!scalePerson) {
      scalePerson = await payload.create({
        collection: "people",
        data: {
          authorApprovalRecordedAt: "2026-07-27T00:00:00.000Z",
          city: sequence % 2 === 0 ? "Chengdu" : "Shanghai",
          identity: "Fictional scale-test contributor",
          introduction: "A fictional profile used only to verify people discovery at pagination scale.",
          languages: sequence % 3 === 0 ? ["en", "es"] : ["en"],
          name: `Acceptance Person ${String(sequence).padStart(2, "0")}`,
          portrait: portrait.id,
          profileStatus: "draft",
          slug,
          topics: [topicID],
          user: user.id,
        },
        overrideAccess: false,
        user: editor,
      });
    }

    const articleSlug = `${slug}-report`;
    const articleResult = await payload.find({
      collection: "articles",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { and: [{ locale: { equals: "en" } }, { slug: { equals: articleSlug } }] },
    });
    let scaleArticle = articleResult.docs[0];
    if (!scaleArticle) {
      scaleArticle = await payload.create({
        collection: "articles",
        data: {
          author: scalePerson.id,
          body,
          coverImage: portrait.id,
          format: "reporting",
          geographies: [geographyID],
          locale: "en",
          owner: user.id,
          slug: articleSlug,
          sourceNotes: [{ check: "Fictional scale fixture.", label: "Local fixture" }],
          summary: "A fictional contribution used only to verify the People directory at scale.",
          title: `What acceptance person ${String(sequence).padStart(2, "0")} notices`,
          topics: [topicID],
          translationGroup: `acceptance-people-scale-${String(sequence).padStart(2, "0")}`,
        },
        draft: true,
        overrideAccess: false,
        user: editor,
      });
    }
    await advanceScaleArticle(payload, editor, scaleArticle);

    if (scalePerson.profileStatus !== "public") {
      scalePerson = await payload.update({
        collection: "people",
        id: scalePerson.id,
        data: { profileStatus: "public" },
        overrideAccess: false,
        user: editor,
      });
    }
    assert.equal(scalePerson.profileStatus, "public");
  }

  const publicScalePeople = await payload.find({
    collection: "people",
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    where: { slug: { in: scalePersonSlugs } },
  });
  assert.equal(publicScalePeople.docs.length, scalePersonSlugs.length);

  const rotationPool = scalePersonSlugs.map((slug) => ({ slug }));
  const firstWeek = stableWeeklyPeople(rotationPool, 3, new Date("2026-01-02T00:00:00.000Z"));
  const repeatedWeek = stableWeeklyPeople(rotationPool, 3, new Date("2026-01-03T00:00:00.000Z"));
  const nextWeek = stableWeeklyPeople(rotationPool, 3, new Date("2026-01-09T00:00:00.000Z"));
  const yearEndWeek = stableWeeklyPeople(rotationPool, 3, new Date("2026-12-29T00:00:00.000Z"));
  const newYearWeek = stableWeeklyPeople(rotationPool, 3, new Date("2027-01-05T00:00:00.000Z"));
  assert.deepEqual(repeatedWeek.map((person) => person.slug), firstWeek.map((person) => person.slug));
  assert.equal(
    nextWeek.filter((person) => firstWeek.some((previous) => previous.slug === person.slug)).length,
    0,
  );
  assert.equal(
    newYearWeek.filter((person) => yearEndWeek.some((previous) => previous.slug === person.slug)).length,
    0,
  );

  return {
    publicScalePeople: publicScalePeople.docs.length,
    rotationFirstWeek: firstWeek.map((person) => person.slug),
    rotationNextWeek: nextWeek.map((person) => person.slug),
  };
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

  const portrait = await getOrCreateMedia(payload, editor);

  const person = await getOrCreatePerson(payload, editor, author, portrait, "chen-rui", "Chen Rui");
  const otherPerson = await getOrCreatePerson(
    payload,
    editor,
    otherAuthor,
    portrait,
    "other-author",
    "Other Author",
  );
  assert.ok(otherPerson.id);
  await removePersonRevisions(payload, person.id);
  await removePersonRevisions(payload, otherPerson.id);

  const pinnedPerson = await payload.update({
    collection: "people",
    id: person.id,
    data: { spotlightPinnedUntil: "2027-07-27T00:00:00.000Z" },
    overrideAccess: false,
    user: editor,
  });
  assert.ok(pinnedPerson.spotlightPinnedUntil);
  await expectRejected(
    () => payload.update({
      collection: "people",
      id: otherPerson.id,
      data: { spotlightPinnedUntil: "2027-07-27T00:00:00.000Z" },
      overrideAccess: false,
      user: editor,
    }),
    "Only one person may be pinned in the active spotlight window.",
  );

  await expectRejected(
    () => payload.create({
      collection: "articles",
      data: {
        author: otherPerson.id,
        body,
        format: "guide",
        locale: "en",
        owner: author.id,
        slug: "invalid-other-person-byline",
        sourceNotes: [{ check: "Ownership negative test.", label: "Local fixture" }],
        summary: "This draft must be rejected because its byline belongs to another account.",
        title: "Invalid byline",
        translationGroup: "invalid-other-person-byline",
      },
      draft: true,
      overrideAccess: false,
      user: author,
    }),
    "An author must not submit content under another person's byline.",
  );

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

  const geographyResult = await payload.find({
    collection: "taxonomies",
    limit: 1,
    overrideAccess: true,
    where: { and: [{ dimension: { equals: "geography" } }, { slug: { equals: "shanghai" } }] },
  });
  const geography =
    geographyResult.docs[0] ??
    (await payload.create({
      collection: "taxonomies",
      data: { dimension: "geography", name: "Shanghai", slug: "shanghai" },
      overrideAccess: false,
      user: editor,
    }));

  await removeAcceptancePlaces(payload);
  await removeAcceptanceArticles(payload);

  const english = await payload.create({
    collection: "articles",
    data: {
      author: person.id,
      body,
      coverImage: portrait.id,
      format: "guide",
      freshnessDate: "2026-07-27T00:00:00.000Z",
      geographies: [geography.id],
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

  const spanish = await payload.create({
    collection: "articles",
    data: {
      author: person.id,
      body,
      coverImage: portrait.id,
      format: "guide",
      freshnessDate: "2026-07-27T00:00:00.000Z",
      geographies: [geography.id],
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
      coverImage: portrait.id,
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
    data: {
      homepageEndsAt: "2027-07-27T00:00:00.000Z",
      homepagePlacement: "lead",
      homepageStartsAt: "2026-07-27T00:00:00.000Z",
      workflowStatus: "approved",
    },
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
    classification: "Mobility, Shanghai",
    cover: "Set",
    freshness: "2026-07-27",
    language: "English",
    missing: [],
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
  assert.ok(published.publishedAt);

  const publicPerson = await payload.update({
    collection: "people",
    id: person.id,
    data: { profileStatus: "public" },
    overrideAccess: false,
    user: editor,
  });
  assert.equal(publicPerson.profileStatus, "public");
  assert.ok(publicPerson.profilePublishedAt);

  const anonymousPerson = await payload.find({
    collection: "people",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: "chen-rui" } },
  });
  assert.equal(anonymousPerson.docs.length, 1);
  assert.equal(anonymousPerson.docs[0]?.user, undefined);
  assert.equal(anonymousPerson.docs[0]?.profileStatus, undefined);
  assert.equal(anonymousPerson.docs[0]?.authorApprovalRecordedAt, undefined);
  assert.equal(anonymousPerson.docs[0]?.profilePublishedAt, undefined);

  const unapprovedMedia = await getOrCreateUnapprovedMedia(payload, author);
  await payload.delete({
    collection: "media",
    overrideAccess: true,
    where: { alt: { equals: "Forged ownership portrait" } },
  });
  const forgedOwnershipFile = await readFile(
    path.resolve(process.cwd(), "public/images/fixtures/portrait-b-00.webp"),
  );
  const forgedOwnershipMedia = await payload.create({
    collection: "media",
    data: { alt: "Forged ownership portrait", uploadedBy: otherAuthor.id } as never,
    file: {
      data: forgedOwnershipFile,
      mimetype: "image/webp",
      name: "forged-ownership-portrait.webp",
      size: forgedOwnershipFile.byteLength,
    },
    overrideAccess: false,
    user: author,
  });
  assert.equal(relationID(forgedOwnershipMedia.uploadedBy), author.id);
  const anonymousUnapprovedMedia = await payload.find({
    collection: "media",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    where: { id: { equals: unapprovedMedia.id } },
  });
  assert.equal(anonymousUnapprovedMedia.docs.length, 0);
  const otherAuthorUnapprovedMedia = await payload.find({
    collection: "media",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    user: otherAuthor,
    where: { id: { equals: unapprovedMedia.id } },
  });
  assert.equal(otherAuthorUnapprovedMedia.docs.length, 0);
  const ownerUnapprovedMedia = await payload.find({
    collection: "media",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    user: author,
    where: { id: { equals: unapprovedMedia.id } },
  });
  assert.equal(ownerUnapprovedMedia.docs.length, 1);
  await expectRejected(
    () => payload.update({
      collection: "people",
      id: person.id,
      data: { portrait: unapprovedMedia.id },
      overrideAccess: false,
      user: editor,
    }),
    "An unapproved image must not replace a public portrait.",
  );

  await expectRejected(
    () => payload.update({
      collection: "people",
      id: person.id,
      data: { introduction: "Unreviewed public profile change." },
      overrideAccess: false,
      user: author,
    }),
    "An author must not change a public profile without editorial review.",
  );

  const concurrentRevisionCreates = await Promise.allSettled([
    payload.create({
      collection: "person-revisions",
      data: {} as never,
      overrideAccess: false,
      user: author,
    }),
    payload.create({
      collection: "person-revisions",
      data: {} as never,
      overrideAccess: false,
      user: author,
    }),
  ]);
  assert.equal(concurrentRevisionCreates.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(concurrentRevisionCreates.filter(({ status }) => status === "rejected").length, 1);
  const profileRevision = concurrentRevisionCreates.find(
    (result) => result.status === "fulfilled",
  )!.value;
  assert.equal(profileRevision.status, "draft");
  assert.equal(profileRevision.proposedIntroduction, publicPerson.introduction);

  await expectRejected(
    () => payload.create({
      collection: "person-revisions",
      data: {} as never,
      overrideAccess: false,
      user: author,
    }),
    "Only one open profile revision is allowed per person.",
  );
  const hiddenRevision = await payload.find({
    collection: "person-revisions",
    depth: 0,
    limit: 1,
    overrideAccess: false,
    user: otherAuthor,
    where: { id: { equals: profileRevision.id } },
  });
  assert.equal(hiddenRevision.docs.length, 0);

  const submittedRevision = await payload.update({
    collection: "person-revisions",
    id: profileRevision.id,
    data: {
      proposedIntroduction: "A reviewed fictional profile introduction.",
      status: "submitted",
    },
    overrideAccess: false,
    user: author,
  });
  assert.equal(submittedRevision.status, "submitted");
  assert.ok(submittedRevision.submittedAt);

  const unchangedPublicPerson = await payload.findByID({
    collection: "people",
    id: person.id,
    overrideAccess: true,
  });
  assert.notEqual(unchangedPublicPerson.introduction, submittedRevision.proposedIntroduction);
  await expectRejected(
    () => payload.update({
      collection: "person-revisions",
      id: profileRevision.id,
      data: { proposedCity: "Unreviewed city" },
      overrideAccess: false,
      user: author,
    }),
    "An author must not edit a submitted profile revision.",
  );

  const changesRequestedRevision = await payload.update({
    collection: "person-revisions",
    id: profileRevision.id,
    data: { editorNote: "Use the city shown on the public profile.", status: "changes_requested" },
    overrideAccess: false,
    user: editor,
  });
  assert.equal(changesRequestedRevision.status, "changes_requested");
  const resubmittedRevision = await payload.update({
    collection: "person-revisions",
    id: profileRevision.id,
    data: { proposedCity: "Shanghai", status: "submitted" },
    overrideAccess: false,
    user: author,
  });
  assert.equal(resubmittedRevision.status, "submitted");
  const personBeforeConcurrentReview = await payload.findByID({
    collection: "people",
    id: person.id,
    overrideAccess: true,
  });
  const concurrentReview = await Promise.allSettled([
    payload.update({
      collection: "person-revisions",
      id: profileRevision.id,
      data: {
        proposedIntroduction: "An editor must not silently replace the author's revision.",
        status: "applied",
      },
      overrideAccess: false,
      user: editor,
    }),
    payload.update({
      collection: "person-revisions",
      id: profileRevision.id,
      data: { editorNote: "Concurrent review fixture.", status: "changes_requested" },
      overrideAccess: false,
      user: editor,
    }),
  ]);
  assert.equal(concurrentReview.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(concurrentReview.filter(({ status }) => status === "rejected").length, 1);
  const revisionAfterConcurrentReview = await payload.findByID({
    collection: "person-revisions",
    id: profileRevision.id,
    overrideAccess: true,
  });
  const personAfterConcurrentReview = await payload.findByID({
    collection: "people",
    id: person.id,
    overrideAccess: true,
  });
  if (revisionAfterConcurrentReview.status === "changes_requested") {
    assert.equal(personAfterConcurrentReview.introduction, personBeforeConcurrentReview.introduction);
    await payload.update({
      collection: "person-revisions",
      id: profileRevision.id,
      data: { status: "submitted" },
      overrideAccess: false,
      user: author,
    });
  } else {
    assert.equal(revisionAfterConcurrentReview.status, "applied");
    assert.equal(personAfterConcurrentReview.introduction, submittedRevision.proposedIntroduction);
  }
  const appliedRevision = revisionAfterConcurrentReview.status === "applied"
    ? revisionAfterConcurrentReview
    : await payload.update({
        collection: "person-revisions",
        id: profileRevision.id,
        data: {
          proposedIntroduction: "An editor must not silently replace the author's revision.",
          status: "applied",
        },
        overrideAccess: false,
        user: editor,
      });
  assert.equal(appliedRevision.status, "applied");
  assert.equal(appliedRevision.proposedIntroduction, submittedRevision.proposedIntroduction);
  assert.ok(appliedRevision.appliedAt);
  const revisedPublicPerson = await payload.findByID({
    collection: "people",
    id: person.id,
    overrideAccess: true,
  });
  assert.equal(revisedPublicPerson.introduction, submittedRevision.proposedIntroduction);
  await expectRejected(
    () => payload.delete({
      collection: "person-revisions",
      id: profileRevision.id,
      overrideAccess: false,
      user: superAdmin,
    }),
    "Applied profile revision evidence must not be deleted through normal collection access.",
  );

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

  await payload.update({
    collection: "articles",
    id: spanish.id,
    data: { workflowStatus: "in_review" },
    draft: true,
    overrideAccess: false,
    user: editor,
  });
  await payload.update({
    collection: "articles",
    id: spanish.id,
    data: { workflowStatus: "approved" },
    draft: true,
    overrideAccess: false,
    user: editor,
  });
  const publishedSpanish = await payload.update({
    collection: "articles",
    id: spanish.id,
    context: { publicationConfirmed: true },
    data: { workflowStatus: "public" },
    overrideAccess: false,
    user: editor,
  });
  assert.equal(publishedSpanish.workflowStatus, "public");
  assert.ok(publishedSpanish.publishedAt);

  const story = await payload.create({
    collection: "articles",
    data: {
      author: person.id,
      body,
      coverImage: portrait.id,
      format: "reporting",
      geographies: [geography.id],
      homepagePlacement: "selected",
      homepageStartsAt: "2026-07-27T00:00:00.000Z",
      locale: "en",
      owner: author.id,
      slug: "shanghai-morning-routes",
      sourceNotes: [
        {
          check: "Fictional source note for the public Story route.",
          label: "Local fixture",
        },
      ],
      summary: "A fictional report used to verify the public Story route.",
      title: "Shanghai's morning routes",
      topics: [topic.id],
      translationGroup: "acceptance-shanghai-morning-routes",
    },
    draft: true,
    overrideAccess: false,
    user: editor,
  });
  await expectRejected(
    () => payload.update({
      collection: "articles",
      id: story.id,
      data: { homepageEndsAt: "2025-07-27T00:00:00.000Z" },
      draft: true,
      overrideAccess: false,
      user: editor,
    }),
    "Homepage curation must not end before it starts.",
  );
  for (const workflowStatus of ["submitted", "in_review", "approved"] as const) {
    await payload.update({
      collection: "articles",
      id: story.id,
      data: { workflowStatus },
      draft: true,
      overrideAccess: false,
      user: editor,
    });
  }
  const publishedStory = await payload.update({
    collection: "articles",
    id: story.id,
    context: { publicationConfirmed: true },
    data: { workflowStatus: "public" },
    overrideAccess: false,
    user: editor,
  });
  assert.equal(publishedStory.workflowStatus, "public");
  assert.ok(publishedStory.publishedAt);

  const englishPlace = await payload.create({
    collection: "places",
    draft: true,
    data: {
      coverImage: portrait.id,
      geography: geography.id,
      locale: "en",
      name: "Shanghai",
      slug: "shanghai",
      summary: "A fictional place node used to verify geographic discovery.",
      translationGroup: "acceptance-shanghai",
    },
    overrideAccess: false,
    user: editor,
  });
  assert.equal(englishPlace.status, "draft");

  const spanishPlace = await payload.create({
    collection: "places",
    draft: true,
    data: {
      coverImage: portrait.id,
      geography: geography.id,
      locale: "es",
      name: "Shanghái",
      slug: "shanghai-es",
      summary: "Un nodo ficticio para comprobar el descubrimiento geográfico.",
      translationGroup: "acceptance-shanghai",
    },
    overrideAccess: false,
    user: editor,
  });

  const publicEnglishPlace = await payload.update({
    collection: "places",
    id: englishPlace.id,
    data: { status: "public" },
    overrideAccess: false,
    user: editor,
  });
  const publicSpanishPlace = await payload.update({
    collection: "places",
    id: spanishPlace.id,
    data: { status: "public" },
    overrideAccess: false,
    user: editor,
  });
  assert.ok(publicEnglishPlace.publishedAt);
  assert.ok(publicSpanishPlace.publishedAt);

  const anonymousPlaces = await payload.find({
    collection: "places",
    depth: 0,
    limit: 10,
    overrideAccess: false,
    where: { locale: { equals: "en" } },
  });
  assert.equal(anonymousPlaces.docs.length, 1);
  assert.equal(anonymousPlaces.docs[0]?.name, "Shanghai");
  assert.equal(anonymousPlaces.docs[0]?.status, undefined);

  const unlinkedGeography = await payload.create({
    collection: "taxonomies",
    data: { dimension: "geography", name: "Unlinked", slug: "unlinked" },
    overrideAccess: false,
    user: editor,
  });
  const unlinkedPlace = await payload.create({
    collection: "places",
    draft: true,
    data: {
      coverImage: portrait.id,
      geography: unlinkedGeography.id,
      locale: "en",
      name: "Unlinked",
      slug: "unlinked",
      summary: "This fixture must remain private without related public content.",
      translationGroup: "acceptance-unlinked-place",
    },
    overrideAccess: false,
    user: editor,
  });
  await expectRejected(
    () => payload.update({
      collection: "places",
      id: unlinkedPlace.id,
      data: { status: "public" },
      overrideAccess: false,
      user: editor,
    }),
    "A place without related public content must not become public.",
  );

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

  const peopleScale = await ensureScalePeople(
    payload,
    editor,
    portrait,
    topic.id,
    geography.id,
  );

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
        anonymousPlaces: anonymousPlaces.docs.length,
        anonymousWithdrawn: withdrawnPublic.docs.length,
        authorSeesOtherDraft: hiddenOtherDraft.docs.length,
        articleID: english.id,
        checks: "PASS",
        peopleScale,
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
