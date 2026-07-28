import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPayload, type Payload } from "payload";

import config from "@payload-config";
import { getLatestDraftData } from "@/cms/article-endpoints";
import { buildPublicationSummary } from "@/cms/publication-summary";
import { isCMSUser } from "@/cms/roles";
import type { Article, Media, User } from "@/payload-types";

const password = process.env.CMS_TEST_PASSWORD;
if (!password) throw new Error("CMS_TEST_PASSWORD is required for local fixture tests.");

const body: NonNullable<Article["body"]> = {
  root: {
    type: "root",
    children: [{
      type: "paragraph",
      children: [{
        type: "text", detail: 0, format: 0, mode: "normal", style: "",
        text: "A fictional post used to verify member publication and site curation.", version: 1,
      }],
      direction: null, format: "", indent: 0, textFormat: 0, textStyle: "", version: 1,
    }],
    direction: null, format: "", indent: 0, version: 1,
  },
};

function relationID(value: number | User | { id: number | string } | null | undefined) {
  return value && typeof value === "object" ? value.id : value;
}

async function expectRejected(action: () => Promise<unknown>, label: string) {
  let rejected = false;
  try { await action(); } catch { rejected = true; }
  assert.equal(rejected, true, label);
}

async function user(payload: Payload, input: { email: string; displayName: string; role: User["role"] }) {
  const existing = await payload.find({
    collection: "users", limit: 1, overrideAccess: true,
    where: { email: { equals: input.email } },
  });
  if (existing.docs[0]) return existing.docs[0];
  return payload.create({ collection: "users", data: { ...input, accountStatus: "active", password }, overrideAccess: true });
}

async function image(payload: Payload, actor: User, alt: string, approved: boolean) {
  const existing = await payload.find({
    collection: "media", limit: 1, overrideAccess: true, where: { alt: { equals: alt } },
  });
  if (existing.docs[0]) return existing.docs[0];
  const data = await readFile(path.resolve(process.cwd(), "public/images/fixtures/portrait-a-00.webp"));
  return payload.create({
    collection: "media",
    data: { alt, ...(approved ? { publicUseApprovedAt: "2026-07-28T00:00:00.000Z" } : {}) },
    file: { data, mimetype: "image/webp", name: `${alt.replaceAll(" ", "-")}.webp`, size: data.byteLength },
    overrideAccess: false,
    user: actor,
  });
}

async function person(
  payload: Payload,
  editor: User,
  member: User,
  portrait: Media,
  slug: string,
) {
  const existing = await payload.find({
    collection: "people", limit: 1, overrideAccess: true,
    where: { or: [{ slug: { equals: slug } }, { user: { equals: member.id } }] },
  });
  if (existing.docs[0]) {
    return payload.update({
      collection: "people", id: existing.docs[0].id,
      context: { profileTransitionConfirmed: true },
      data: { city: "Test City", identity: "Fictional member", introduction: "Local acceptance profile.", languages: ["en"], name: member.displayName, portrait: portrait.id, profileStatus: "draft", slug },
      overrideAccess: false, user: editor,
    });
  }
  return payload.create({
    collection: "people",
    data: { city: "Test City", identity: "Fictional member", introduction: "Local acceptance profile.", languages: ["en"], name: member.displayName, portrait: portrait.id, profileStatus: "draft", slug, user: member.id },
    overrideAccess: false,
    user: editor,
  });
}

async function clean(payload: Payload) {
  const articles = await payload.find({
    collection: "articles", depth: 0, limit: 50, overrideAccess: true,
    where: { translationGroup: { in: ["acceptance-member-curation", "acceptance-member-personal-only", "acceptance-editor-member", "acceptance-other-personal-only"] } },
  });
  for (const article of articles.docs) {
    await payload.delete({ collection: "workflow-events", overrideAccess: true, where: { article: { equals: article.id } } });
    await payload.delete({ collection: "articles", id: article.id, overrideAccess: true });
  }
}

async function main() {
  const payload = await getPayload({ config });
  const lifecycleEmail = `pub-curation-lifecycle-${randomUUID()}@test.invalid`;
  const lifecycleUser = await payload.create({
    collection: "users",
    data: { accountStatus: "active", displayName: "Lifecycle Member", email: lifecycleEmail, password, role: "author" },
    overrideAccess: true,
  });
  const lifecycleProfiles = await payload.find({
    collection: "people", limit: 2, overrideAccess: true,
    where: { user: { equals: lifecycleUser.id } },
  });
  assert.equal(lifecycleProfiles.docs.length, 1);
  assert.equal(lifecycleProfiles.docs[0]?.profileStatus, "draft");
  const profileGateDraft = await payload.create({
    collection: "articles",
    data: { body, locale: "en", slug: `profile-gate-${randomUUID()}`, title: "Profile gate", translationGroup: randomUUID() },
    draft: true, overrideAccess: false, user: lifecycleUser,
  });
  await expectRejected(() => payload.update({
    collection: "articles", id: profileGateDraft.id, context: { memberPublicationConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: lifecycleUser,
  }), "An article cannot become public before its author profile is public.");
  await payload.delete({ collection: "workflow-events", overrideAccess: true, where: { article: { equals: profileGateDraft.id } } });
  await payload.delete({ collection: "articles", id: profileGateDraft.id, overrideAccess: true });
  const lifecycleLogin = await payload.login({
    collection: "users", data: { email: lifecycleEmail, password: password! },
  });
  assert.ok(lifecycleLogin.token);
  await payload.update({
    collection: "users", id: lifecycleUser.id,
    data: { accountStatus: "paused" }, overrideAccess: true,
  });
  await expectRejected(() => payload.login({
    collection: "users", data: { email: lifecycleEmail, password: password! },
  }), "A paused member cannot log in.");
  const pausedJWT = await payload.auth({
    headers: new Headers({ authorization: `JWT ${lifecycleLogin.token}` }),
  });
  assert.equal(pausedJWT.user?.accountStatus, "paused");
  assert.equal(isCMSUser(pausedJWT.user), false, "A pre-existing JWT cannot authorize a paused account.");
  await expectRejected(() => payload.update({
    collection: "users", id: lifecycleUser.id,
    data: { displayName: "Paused update" }, overrideAccess: false, user: { ...lifecycleUser, accountStatus: "paused" },
  }), "A paused member cannot use an existing API session.");
  await payload.delete({ collection: "people", id: lifecycleProfiles.docs[0]!.id, overrideAccess: true });
  await payload.delete({ collection: "users", id: lifecycleUser.id, overrideAccess: true });

  const admin = await user(payload, { displayName: "Acceptance Admin", email: "pub-curation-admin@test.invalid", role: "super_admin" });
  const editor = await user(payload, { displayName: "Acceptance Editor", email: "pub-curation-editor@test.invalid", role: "editor" });
  const member = await user(payload, { displayName: "Acceptance Member", email: "pub-curation-member@test.invalid", role: "author" });
  const other = await user(payload, { displayName: "Other Member", email: "pub-curation-other@test.invalid", role: "author" });
  await clean(payload);

  const memberPortrait = await image(payload, member, "Member publication portrait", false);
  const approvedImage = await image(payload, editor, "Site curation image", true);
  const memberPerson = await person(payload, editor, member, memberPortrait, "acceptance-member");
  const otherPerson = await person(payload, editor, other, approvedImage, "acceptance-other");
  const editorPerson = await person(payload, admin, editor, approvedImage, "acceptance-editor");

  const publicProfile = await payload.update({
    collection: "people", id: memberPerson.id, context: { profileTransitionConfirmed: true }, data: { profileStatus: "public" },
    overrideAccess: false, user: member,
  });
  assert.equal(publicProfile.profileStatus, "public");
  assert.ok(publicProfile.profilePublishedAt);
  const publishedPortrait = await payload.findByID({ collection: "media", id: memberPortrait.id, overrideAccess: true });
  assert.ok(publishedPortrait.memberUsePublishedAt);

  const unsupportedLanguageDraft = await payload.create({
    collection: "articles",
    data: { body, locale: "es", slug: `unsupported-language-${randomUUID()}`, title: "Unsupported language", translationGroup: randomUUID() },
    draft: true, overrideAccess: false, user: member,
  });
  await expectRejected(() => payload.update({
    collection: "articles", id: unsupportedLanguageDraft.id, context: { memberPublicationConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: member,
  }), "An article language must already be public on its author profile.");
  await payload.delete({ collection: "workflow-events", overrideAccess: true, where: { article: { equals: unsupportedLanguageDraft.id } } });
  await payload.delete({ collection: "articles", id: unsupportedLanguageDraft.id, overrideAccess: true });

  const draft = await payload.create({
    collection: "articles",
    data: { body, locale: "en", slug: "member-direct-post", title: "Member direct post", translationGroup: "acceptance-member-curation" },
    draft: true, overrideAccess: false, user: member,
  });
  assert.equal(draft.publicationStatus, "draft");
  assert.equal(draft.curationStatus, "not_selected");
  assert.equal(relationID(draft.owner), member.id);
  assert.equal(relationID(draft.author), memberPerson.id);
  assert.equal((await payload.findVersions({
    collection: "articles", limit: 10, overrideAccess: false, user: other,
    where: { parent: { equals: draft.id } },
  })).totalDocs, 0);

  await expectRejected(() => payload.update({
    collection: "articles", id: draft.id, data: { title: "Wrong owner" }, draft: true,
    overrideAccess: false, user: other,
  }), "Another member cannot edit the article.");
  const forgedCreate = await payload.create({
    collection: "articles",
    data: { author: otherPerson.id, body, locale: "en", owner: member.id, slug: "forged-byline", title: "Forged byline", translationGroup: "acceptance-member-curation" },
    draft: true, overrideAccess: false, user: member,
  });
  assert.equal(relationID(forgedCreate.owner), member.id);
  assert.equal(relationID(forgedCreate.author), memberPerson.id);
  await payload.delete({ collection: "workflow-events", overrideAccess: true, where: { article: { equals: forgedCreate.id } } });
  await payload.delete({ collection: "articles", id: forgedCreate.id, overrideAccess: true });

  const memberPublished = await payload.update({
    collection: "articles", id: draft.id, context: { memberPublicationConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: member,
  });
  assert.equal(memberPublished.publicationStatus, "published");
  assert.equal(memberPublished.curationStatus, "not_selected");
  assert.equal(memberPublished._status, "published");
  await expectRejected(() => payload.update({
    collection: "people", id: memberPerson.id, context: { profileTransitionConfirmed: true },
    data: { profileStatus: "draft" }, overrideAccess: false, user: member,
  }), "A profile with public articles cannot become private.");
  await expectRejected(() => payload.update({
    collection: "people", id: memberPerson.id,
    data: { languages: ["es"] }, overrideAccess: false, user: member,
  }), "A public profile must retain every language used by its public articles.");
  await expectRejected(() => payload.update({
    collection: "people", id: memberPerson.id,
    data: { portrait: null }, overrideAccess: false, user: member,
  }), "A public profile cannot remove its portrait.");
  await expectRejected(() => payload.update({
    collection: "people", id: memberPerson.id,
    data: { identity: null }, overrideAccess: false, user: member,
  }), "A public profile cannot clear required identity information.");
  await expectRejected(() => payload.update({
    collection: "people", id: memberPerson.id,
    data: { profilePublishedAt: null }, overrideAccess: false, user: editor,
  }), "Profile publication time cannot be cleared through the normal API.");
  await expectRejected(() => payload.update({
    collection: "people", id: memberPerson.id,
    data: { slug: "changed-public-profile-url" }, overrideAccess: false, user: member,
  }), "A published profile URL is canonical and cannot be changed.");
  await expectRejected(() => payload.delete({
    collection: "people", id: memberPerson.id, overrideAccess: false, user: admin,
  }), "A profile with public articles cannot be deleted.");
  await expectRejected(() => payload.delete({
    collection: "users", id: member.id, overrideAccess: false, user: admin,
  }), "A member account with a profile or articles cannot be deleted.");
  const memberStatusBypass = await payload.update({
    collection: "articles", id: draft.id, data: { _status: "draft" },
    draft: false, overrideAccess: false, user: member,
  });
  assert.equal(memberStatusBypass.publicationStatus, "published");
  assert.equal(memberStatusBypass._status, "published");
  const editorStatusBypass = await payload.update({
    collection: "articles", id: draft.id, data: { _status: "draft" },
    draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(editorStatusBypass.publicationStatus, "published");
  assert.equal(editorStatusBypass._status, "published");
  await expectRejected(() => payload.update({
    collection: "articles", id: draft.id, data: { publicationStatus: "withdrawn" },
    overrideAccess: false, user: member,
  }), "A member cannot bypass the publication action through the normal API.");
  await expectRejected(() => payload.update({
    collection: "articles", id: draft.id, data: { locale: "es" }, draft: false,
    overrideAccess: false, user: member,
  }), "A published article language is canonical and cannot be changed.");
  await expectRejected(() => payload.update({
    collection: "articles", id: draft.id, data: { slug: "changed-public-url" }, draft: false,
    overrideAccess: false, user: member,
  }), "A published article URL is canonical and cannot be changed.");
  await expectRejected(() => payload.update({
    collection: "articles", id: draft.id, data: { translationGroup: "changed-group" }, draft: false,
    overrideAccess: false, user: member,
  }), "An article translation group is immutable.");

  const anonymousBeforeCuration = await payload.find({
    collection: "articles", depth: 0, limit: 5, overrideAccess: false,
    where: { slug: { equals: "member-direct-post" } },
  });
  assert.equal(anonymousBeforeCuration.docs.length, 1);
  assert.equal(anonymousBeforeCuration.docs[0]?.owner, undefined);
  assert.equal(anonymousBeforeCuration.docs[0]?.publicationStatus, undefined);
  assert.equal(anonymousBeforeCuration.docs[0]?.curationStatus, "not_selected");

  const selected = await payload.update({
    collection: "articles", id: draft.id, data: { curationStatus: "selected" },
    draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(selected.curationStatus, "selected");
  await expectRejected(() => payload.update({
    collection: "articles", id: draft.id, data: { curationStatus: "curated" },
    draft: false, overrideAccess: false, user: editor,
  }), "Incomplete member content cannot enter site distribution.");

  await payload.update({
    collection: "media",
    id: memberPortrait.id,
    data: { publicUseApprovedAt: "2026-07-28T00:00:00.000Z" },
    overrideAccess: false,
    user: editor,
  });

  const prepared = await payload.update({
    collection: "articles", id: draft.id,
    data: {
      coverImage: approvedImage.id,
      curationStatus: "editing",
      format: "analysis",
      sourceNotes: [{ check: "Local curation check", label: "Acceptance source" }],
      summary: "A fictional summary prepared for site distribution.",
    },
    draft: false, overrideAccess: false, user: editor,
  });
  const curated = await payload.update({
    collection: "articles", id: draft.id, data: { curationStatus: "curated" },
    draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(curated.id, draft.id);
  assert.equal(curated.curationStatus, "curated");
  assert.equal(relationID(curated.author), memberPerson.id);
  assert.equal(buildPublicationSummary(await payload.findByID({ collection: "articles", id: draft.id, depth: 2, draft: true, overrideAccess: true })).url, "/en/posts/member-direct-post");
  assert.equal(prepared.id, curated.id);

  const memberAttemptedEditorialChange = await payload.update({
    collection: "articles", id: draft.id,
    data: {
      format: "reporting",
      freshnessDate: "2027-01-01T00:00:00.000Z",
      sourceNotes: [{ label: "Member should not set this" }],
      title: "Member ordinary edit after curation",
    },
    draft: false, overrideAccess: false, user: member,
  });
  assert.equal(memberAttemptedEditorialChange.format, "analysis");
  assert.equal(memberAttemptedEditorialChange.freshnessDate, null);
  assert.deepEqual(memberAttemptedEditorialChange.sourceNotes, prepared.sourceNotes);
  assert.equal(memberAttemptedEditorialChange.curationStatus, "needs_recheck");
  const recurateAfterDirectEdit = await payload.update({
    collection: "articles", id: draft.id, data: { curationStatus: "curated" },
    draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(recurateAfterDirectEdit.curationStatus, "curated");

  const articleCount = await payload.count({
    collection: "articles", overrideAccess: true,
    where: { translationGroup: { equals: "acceptance-member-curation" } },
  });
  assert.equal(articleCount.totalDocs, 1);

  const autosavedDraft = await payload.update({
    collection: "articles", id: draft.id,
    data: { _status: "draft", title: "Member direct post updated" },
    autosave: true, draft: true, overrideAccess: false, user: member,
  });
  assert.equal(autosavedDraft.title, "Member direct post updated");
  const latestDraftData = await getLatestDraftData(payload, draft.id, curated);
  assert.equal(latestDraftData.title, "Member direct post updated");
  const memberUpdate = await payload.update({
    collection: "articles", id: draft.id, context: { memberPublicationConfirmed: true },
    data: { ...latestDraftData, publicationStatus: "published" },
    draft: false, overrideAccess: false, user: member,
  });
  assert.equal(memberUpdate.title, "Member direct post updated");
  assert.equal(memberUpdate.curationStatus, "needs_recheck");
  assert.equal(relationID(memberUpdate.author), memberPerson.id);

  const recurate = await payload.update({
    collection: "articles", id: draft.id, data: { curationStatus: "curated" },
    draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(recurate.curationStatus, "curated");
  const removed = await payload.update({
    collection: "articles", id: draft.id, data: { curationStatus: "removed" },
    draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(removed.publicationStatus, "published");
  assert.equal((await payload.find({ collection: "articles", limit: 1, overrideAccess: false, where: { id: { equals: draft.id } } })).docs.length, 1);

  const withdrawn = await payload.update({
    collection: "articles", id: draft.id, context: { publicationTransitionConfirmed: true }, data: { publicationStatus: "withdrawn", _status: "draft" },
    overrideAccess: false, user: member,
  });
  assert.equal(withdrawn.publicationStatus, "withdrawn");
  assert.equal(withdrawn.curationStatus, "removed");
  assert.equal((await payload.find({ collection: "articles", limit: 1, overrideAccess: false, where: { id: { equals: draft.id } } })).docs.length, 0);

  const republished = await payload.update({
    collection: "articles", id: draft.id, context: { memberPublicationConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: member,
  });
  assert.equal(republished.publicationStatus, "published");
  assert.equal(republished.curationStatus, "removed");

  await payload.update({
    collection: "articles", id: draft.id, data: { curationStatus: "selected" },
    draft: false, overrideAccess: false, user: editor,
  });
  const finallyCurated = await payload.update({
    collection: "articles", id: draft.id, data: { curationStatus: "curated" },
    draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(finallyCurated.curationStatus, "curated");

  const personalOnlyDraft = await payload.create({
    collection: "articles",
    data: { author: memberPerson.id, body, locale: "en", owner: member.id, slug: "member-personal-only", title: "Member personal-only post", translationGroup: "acceptance-member-personal-only" },
    draft: true, overrideAccess: false, user: member,
  });
  const personalOnly = await payload.update({
    collection: "articles", id: personalOnlyDraft.id, context: { memberPublicationConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: member,
  });
  assert.equal(personalOnly.curationStatus, "not_selected");
  const adminWithdrawn = await payload.update({
    collection: "articles", id: personalOnly.id, context: { publicationTransitionConfirmed: true },
    data: { publicationStatus: "withdrawn" }, overrideAccess: false, user: admin,
  });
  assert.equal(adminWithdrawn.publicationStatus, "withdrawn");
  const adminRepublished = await payload.update({
    collection: "articles", id: personalOnly.id,
    context: { memberPublicationConfirmed: true, publicationTransitionConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: admin,
  });
  assert.equal(adminRepublished.publicationStatus, "published");

  await payload.update({
    collection: "people", id: otherPerson.id, context: { profileTransitionConfirmed: true }, data: { profileStatus: "public" },
    overrideAccess: false, user: other,
  });
  const otherPersonalDraft = await payload.create({
    collection: "articles",
    data: { body, locale: "en", slug: "other-member-personal-only", title: "Other member personal-only post", translationGroup: "acceptance-other-personal-only" },
    draft: true, overrideAccess: false, user: other,
  });
  await payload.update({
    collection: "articles", id: otherPersonalDraft.id, context: { memberPublicationConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: other,
  });
  const siteSelectedOtherArticles = await payload.find({
    collection: "articles", limit: 10, overrideAccess: true,
    where: {
      and: [
        { owner: { equals: other.id } },
        { publicationStatus: { equals: "published" } },
        { curationStatus: { equals: "curated" } },
      ],
    },
  });
  assert.equal(siteSelectedOtherArticles.totalDocs, 0);

  const directProfileUpdate = await payload.update({
    collection: "people", id: memberPerson.id, data: { introduction: "Updated directly by the member." },
    overrideAccess: false, user: member,
  });
  assert.equal(directProfileUpdate.introduction, "Updated directly by the member.");
  await expectRejected(() => payload.update({
    collection: "people", id: memberPerson.id, data: { profileStatus: "draft" },
    overrideAccess: false, user: member,
  }), "A member cannot bypass the profile visibility action through the normal API.");
  const profileVersions = await payload.findVersions({
    collection: "people", limit: 10, overrideAccess: false, user: member,
    where: { parent: { equals: memberPerson.id } },
  });
  assert.ok(profileVersions.totalDocs >= 1);
  assert.equal((await payload.findVersions({
    collection: "people", limit: 10, overrideAccess: false, user: other,
    where: { parent: { equals: memberPerson.id } },
  })).totalDocs, 0);

  await payload.update({ collection: "people", id: editorPerson.id, context: { profileTransitionConfirmed: true }, data: { profileStatus: "public" }, overrideAccess: false, user: editor });
  const editorDraft = await payload.create({
    collection: "articles",
    data: { author: editorPerson.id, body, locale: "en", owner: editor.id, slug: "editor-as-member", title: "Editor as member", translationGroup: "acceptance-editor-member" },
    draft: true, overrideAccess: false, user: editor,
  });
  const editorPublished = await payload.update({
    collection: "articles", id: editorDraft.id, context: { memberPublicationConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(editorPublished.publicationStatus, "published");
  assert.equal(relationID(editorPublished.author), editorPerson.id);

  const events = await payload.find({ collection: "workflow-events", limit: 100, overrideAccess: true, where: { article: { equals: draft.id } } });
  assert.ok(events.docs.some((event) => event.axis === "publication" && event.toStatus === "published"));
  assert.ok(events.docs.some((event) => event.axis === "curation" && event.toStatus === "curated"));
  assert.ok(events.docs.some((event) => event.axis === "curation" && event.toStatus === "needs_recheck" && event.notificationKind === "needs_recheck"));
  assert.ok(events.docs.some((event) => event.axis === "curation" && event.toStatus === "selected" && event.notificationKind === "selected"));
  assert.ok(events.docs.filter((event) => event.notificationKind).every((event) => event.notificationStatus === "not_required"));

  console.log(JSON.stringify({
    articleID: draft.id,
    articleCount: articleCount.totalDocs,
    bylinePersonID: relationID(republished.author),
    editorCanContribute: editorPublished.id,
    events: events.totalDocs,
    finalPublication: republished.publicationStatus,
    finalCuration: finallyCurated.curationStatus,
    personalOnly: personalOnly.id,
  }, null, 2));
}

await main();
