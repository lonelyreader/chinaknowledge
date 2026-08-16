import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createLocalReq, getPayload, type Payload } from "payload";

import config from "@payload-config";
import { getLatestDraftData } from "@/cms/article-publication";
import { createArticleTranslationDraft } from "@/cms/article-translation";
import { editorialMasterContentHash } from "@/cms/editorial-master-hooks";
import { buildPublicationSummary } from "@/cms/publication-summary";
import { isCMSUser } from "@/cms/roles";
import { commitProfilePublication, prepareProfilePublication } from "@/cms/profile-publication";
import { inviteUserEndpoint } from "@/cms/user-endpoints";
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

assert.equal(
  editorialMasterContentHash({
    bodyZh: body,
    purpose: 1,
    sourceNotes: [{ checkedAt: "2026-08-04T00:00:00+08:00", label: "Official", rights: "official", url: "https://example.com" }],
    summaryZh: "Same instant in two date formats.",
    titleZh: "Canonical dates",
  }),
  editorialMasterContentHash({
    bodyZh: body,
    purpose: 1,
    sourceNotes: [{ checkedAt: "2026-08-03T16:00:00.000Z", label: "Official", rights: "official", url: "https://example.com" }],
    summaryZh: "Same instant in two date formats.",
    titleZh: "Canonical dates",
  }),
  "Editorial master hashes must canonicalize equivalent source verification dates.",
);

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
    where: { translationGroup: { in: ["acceptance-member-curation", "acceptance-member-personal-only", "acceptance-editor-member", "acceptance-forged-byline", "acceptance-other-personal-only", "acceptance-site-content"] } },
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
  const editorVisibleUsers = await payload.find({ collection: "users", limit: 10, overrideAccess: false, user: editor });
  assert.equal(editorVisibleUsers.totalDocs, 1);
  assert.equal(editorVisibleUsers.docs[0]?.id, editor.id);
  const invitedEmail = `invited-member-${randomUUID()}@test.invalid`;
  const spoofedDirectCreateData = {
    accountStatus: "active" as const,
    displayName: "Spoofed Direct Member",
    email: `spoofed-direct-${randomUUID()}@test.invalid`,
    password,
    role: "author" as const,
  };
  await expectRejected(() => payload.create({
    collection: "users",
    context: { userInviteCreate: true },
    data: spoofedDirectCreateData,
    overrideAccess: false,
    user: admin,
  }), "A Super Admin cannot forge invitation access through Local API context.");
  await expectRejected(() => payload.create({
    collection: "users",
    data: { accountStatus: "active", displayName: "Invited Member", email: invitedEmail, password, role: "author" },
    overrideAccess: false,
    user: admin,
  }), "A Super Admin cannot create a member outside the invitation endpoint.");
  await expectRejected(() => payload.create({
    collection: "users",
    context: { userInviteCreate: true },
    data: { accountStatus: "active", displayName: "Forged Member", email: `forged-member-${randomUUID()}@test.invalid`, password, role: "author" },
    overrideAccess: false,
    user: member,
  }), "A Member cannot create an account even with a forged invitation context.");
  const anonymousInviteRequest = await createLocalReq({}, payload);
  anonymousInviteRequest.json = async () => ({ displayName: "Anonymous Invite", email: `anonymous-invite-${randomUUID()}@test.invalid`, role: "author" });
  await expectRejected(
    async () => inviteUserEndpoint.handler(anonymousInviteRequest),
    "An anonymous request cannot use the invitation endpoint.",
  );
  const memberInviteRequest = await createLocalReq({ user: member }, payload);
  memberInviteRequest.json = async () => ({ displayName: "Member Invite", email: `member-invite-${randomUUID()}@test.invalid`, role: "author" });
  await expectRejected(
    async () => inviteUserEndpoint.handler(memberInviteRequest),
    "A Member cannot use the invitation endpoint.",
  );
  const editorInviteRequest = await createLocalReq({ user: editor }, payload);
  editorInviteRequest.json = async () => ({ displayName: "Blocked Invite", email: `blocked-invite-${randomUUID()}@test.invalid`, role: "author" });
  await expectRejected(
    async () => inviteUserEndpoint.handler(editorInviteRequest),
    "Only a Super Admin can use the invitation endpoint.",
  );
  const adminInviteRequest = await createLocalReq({ user: admin }, payload);
  adminInviteRequest.json = async () => ({ displayName: "Invited Member", email: invitedEmail, role: "author" });
  const inviteResponse = await inviteUserEndpoint.handler(adminInviteRequest);
  assert.equal(inviteResponse.status, 201);
  const inviteResult = await inviteResponse.json() as { id: number };
  const invited = await payload.findByID({ collection: "users", id: inviteResult.id, overrideAccess: true });
  const invitedProfiles = await payload.find({
    collection: "people", limit: 2, overrideAccess: true,
    where: { user: { equals: invited.id } },
  });
  assert.equal(invitedProfiles.docs.length, 1, "A Super Admin invitation creates exactly one linked Person.");
  await payload.delete({ collection: "people", id: invitedProfiles.docs[0]!.id, overrideAccess: true });
  await payload.delete({ collection: "users", id: invited.id, overrideAccess: true });
  await clean(payload);

  const purposeSearch = await payload.find({
    collection: "taxonomies", limit: 1, overrideAccess: true,
    where: { and: [{ dimension: { equals: "purpose" } }, { slug: { equals: "understand" } }] },
  });
  const purpose = purposeSearch.docs[0] ?? await payload.create({
    collection: "taxonomies",
    data: { dimension: "purpose", name: "Understand", slug: "understand" },
    overrideAccess: false,
    user: editor,
  });
  await expectRejected(() => payload.create({
    collection: "editorial-masters",
    data: {
      batchId: "acceptance",
      bodyZh: body,
      contentHash: "pending",
      contentKey: `member-master-${randomUUID()}`,
      createdBy: member.id,
      editorialStatus: "candidate",
      purpose: purpose.id,
      risk: "evergreen",
      rightsStatus: "pending",
      sourceNotes: [{ checkedAt: new Date().toISOString(), label: "Official source", rights: "official", url: "https://example.com/source" }],
      summaryZh: "会员不能建立中文母稿。",
      titleZh: "会员母稿",
    },
    draft: true,
    overrideAccess: false,
    user: member,
  }), "A Member cannot create a Chinese editorial master.");
  const siteMaster = await payload.create({
    collection: "editorial-masters",
    data: {
      batchId: "acceptance",
      bodyZh: body,
      contentHash: "pending",
      contentKey: `acceptance-site-master-${randomUUID()}`,
      createdBy: editor.id,
      editorialStatus: "approved",
      purpose: purpose.id,
      risk: "evergreen",
      rightsStatus: "cleared",
      sourceNotes: [{ checkedAt: new Date().toISOString(), label: "Official source", rights: "official", url: "https://example.com/source" }],
      summaryZh: "用于验证站方内容发布链路的中文母稿。",
      titleZh: "站方内容验收母稿",
    },
    draft: false,
    overrideAccess: false,
    user: editor,
  });
  assert.equal(siteMaster.editorialStatus, "approved");
  assert.equal(siteMaster.rightsStatus, "cleared");
  assert.ok(siteMaster.reviewedAt);
  await expectRejected(
    () => payload.find({ collection: "editorial-masters", limit: 10, overrideAccess: false }),
    "Anonymous readers cannot access Chinese editorial masters.",
  );
  await expectRejected(
    () => payload.find({ collection: "editorial-masters", limit: 10, overrideAccess: false, user: member }),
    "Members cannot access Chinese editorial masters.",
  );
  const siteDraft = await payload.create({
    collection: "articles",
    data: {
      authorshipType: "site",
      body,
      editorialMaster: siteMaster.id,
      format: "analysis",
      locale: "en",
      slug: "site-content-acceptance",
      sourceNotes: [{ checkedAt: new Date().toISOString(), label: "Official source", url: "https://example.com/source" }],
      summary: "A site-authored acceptance article.",
      title: "Site content acceptance",
      translationGroup: "acceptance-site-content",
    },
    draft: true,
    overrideAccess: false,
    user: editor,
  });
  assert.equal(siteDraft.authorshipType, "site");
  assert.equal(siteDraft.author, null);
  assert.equal(relationID(siteDraft.editorialMaster), siteMaster.id);
  await expectRejected(() => payload.update({
    collection: "articles", id: siteDraft.id, context: { memberPublicationConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: editor,
  }), "An Editor cannot publish site-authored content.");
  const sitePublished = await payload.update({
    collection: "articles", id: siteDraft.id, context: { memberPublicationConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: admin,
  });
  assert.equal(sitePublished.publicationStatus, "published");
  assert.equal(sitePublished.author, null);
  await payload.update({
    collection: "articles", id: siteDraft.id,
    data: { curationStatus: "selected" }, draft: false, overrideAccess: false, user: editor,
  });
  const siteCurated = await payload.update({
    collection: "articles", id: siteDraft.id,
    data: { curationStatus: "curated" }, draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(siteCurated.curationStatus, "curated");
  const siteSummary = buildPublicationSummary(await payload.findByID({ collection: "articles", id: siteDraft.id, depth: 2, overrideAccess: true }));
  assert.equal(siteSummary.author, "China, in Fact");
  assert.equal(siteSummary.missing.includes("Author portrait"), false);
  assert.equal(siteSummary.missing.includes("Cover"), false);
  const anonymousSite = await payload.findByID({ collection: "articles", id: siteDraft.id, depth: 0, overrideAccess: false });
  assert.equal(anonymousSite.authorshipType, "site");
  assert.equal(anonymousSite.author, null);
  assert.equal(anonymousSite.editorialMaster, undefined);
  const siteEvents = await payload.find({ collection: "workflow-events", limit: 50, overrideAccess: true, where: { article: { equals: siteDraft.id } } });
  assert.equal(siteEvents.docs.some((event) => event.notificationKind), false);

  const memberPortrait = await image(payload, member, "Member publication portrait", false);
  const approvedImage = await image(payload, editor, "Site curation image", true);
  const memberPerson = await person(payload, editor, member, memberPortrait, "acceptance-member");
  const otherPerson = await person(payload, editor, other, approvedImage, "acceptance-other");
  const editorPerson = await person(payload, admin, editor, approvedImage, "acceptance-editor");

  const memberReq = await createLocalReq({ user: member }, payload);
  const preparedProfile = await prepareProfilePublication(memberPerson, "public", memberReq);
  assert.equal(preparedProfile.action, "publish");
  const publicProfile = await commitProfilePublication(memberPerson, "public", memberReq);
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
  await expectRejected(() => payload.update({
    collection: "people", id: memberPerson.id,
    data: { links: [{ label: "Unsafe", type: "personal_site", url: "javascript:alert(1)" }] },
    overrideAccess: false, user: member,
  }), "A public profile rejects unsafe personal links.");
  await expectRejected(() => payload.update({
    collection: "people", id: memberPerson.id,
    data: { links: [{ label: "Email", type: "email", url: "mailto:" }] },
    overrideAccess: false, user: member,
  }), "A public profile rejects an email link without a recipient.");
  const localizedProfile = await payload.update({
    collection: "people", id: memberPerson.id,
    data: {
      cityEs: "Ciudad de prueba",
      identityEs: "Miembro ficticio",
      introductionEs: "Perfil local de aceptación.",
      languages: ["en", "es"],
      links: [{ label: "Email", labelEs: "Correo", type: "email", url: "mailto:member@test.invalid" }],
    },
    overrideAccess: false, user: member,
  });
  assert.equal(localizedProfile.identityEs, "Miembro ficticio");
  assert.equal(localizedProfile.links?.[0]?.labelEs, "Correo");

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
    data: { author: otherPerson.id, body, locale: "en", owner: member.id, slug: "forged-byline", title: "Forged byline", translationGroup: "acceptance-forged-byline" },
    draft: true, overrideAccess: false, user: member,
  });
  assert.equal(relationID(forgedCreate.owner), member.id);
  assert.equal(relationID(forgedCreate.author), memberPerson.id);
  await payload.delete({ collection: "workflow-events", overrideAccess: true, where: { article: { equals: forgedCreate.id } } });
  await payload.delete({ collection: "articles", id: forgedCreate.id, overrideAccess: true });
  const ownTranslationResult = await createArticleTranslationDraft(draft.id, memberReq);
  const ownTranslation = ownTranslationResult.article;
  assert.equal(ownTranslationResult.created, true);
  assert.equal(relationID(ownTranslation.owner), member.id);
  assert.equal(relationID(ownTranslation.author), memberPerson.id);
  assert.equal((await createArticleTranslationDraft(draft.id, memberReq)).created, false);
  await payload.delete({ collection: "workflow-events", overrideAccess: true, where: { article: { equals: ownTranslation.id } } });
  await payload.delete({ collection: "articles", id: ownTranslation.id, overrideAccess: true });
  await expectRejected(() => payload.create({
    collection: "articles",
    data: { body, locale: "en", slug: "duplicate-translation-identity", title: "Duplicate translation identity", translationGroup: "acceptance-member-curation" },
    draft: true, overrideAccess: false, user: member,
  }), "A translation group can contain only one Article per language.");
  await expectRejected(() => payload.create({
    collection: "articles",
    data: { body, locale: "es", slug: "foreign-translation-group", title: "Foreign translation group", translationGroup: "acceptance-member-curation" },
    draft: true, overrideAccess: false, user: other,
  }), "Another member cannot join an existing translation group.");

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
  const memberSlugAttempt = await payload.update({
    collection: "people", id: memberPerson.id,
    data: { slug: "changed-public-profile-url" }, overrideAccess: false, user: member,
  });
  assert.equal(memberSlugAttempt.slug, memberPerson.slug);
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

  const otherMemberArticleRead = await payload.find({
    collection: "articles", depth: 0, limit: 1, overrideAccess: false, user: other,
    where: { id: { equals: draft.id } },
  });
  assert.equal(otherMemberArticleRead.totalDocs, 1);
  assert.equal(otherMemberArticleRead.docs[0]?.owner, undefined);
  assert.equal(otherMemberArticleRead.docs[0]?.publicationStatus, undefined);
  assert.equal(otherMemberArticleRead.docs[0]?.workflowStatus, undefined);
  assert.equal(otherMemberArticleRead.docs[0]?.assignedEditor, undefined);
  assert.deepEqual(otherMemberArticleRead.docs[0]?.editorComments, []);
  assert.equal(otherMemberArticleRead.docs[0]?.homepagePlacement, undefined);
  assert.equal(otherMemberArticleRead.docs[0]?.homepageStartsAt, undefined);
  assert.equal(otherMemberArticleRead.docs[0]?.homepageEndsAt, undefined);
  const otherMemberPersonRead = await payload.find({
    collection: "people", depth: 0, limit: 1, overrideAccess: false, user: other,
    where: { id: { equals: memberPerson.id } },
  });
  assert.equal(otherMemberPersonRead.totalDocs, 1);
  assert.equal(otherMemberPersonRead.docs[0]?.user, undefined);
  assert.equal(otherMemberPersonRead.docs[0]?.profileStatus, undefined);
  assert.equal(otherMemberPersonRead.docs[0]?.authorApprovalRecordedAt, undefined);
  assert.equal(otherMemberPersonRead.docs[0]?.profilePublishedAt, undefined);
  assert.equal(otherMemberPersonRead.docs[0]?.spotlightExcluded, undefined);
  assert.equal(otherMemberPersonRead.docs[0]?.spotlightPinnedUntil, undefined);

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
  const ordinaryEventsBefore = await payload.count({ collection: "workflow-events", overrideAccess: true, where: { article: { equals: draft.id } } });
  const ordinaryProtectedBefore = await payload.findByID({ collection: "articles", id: draft.id, depth: 0, draft: false, overrideAccess: true });
  const ordinarySiteSave = await payload.update({
    collection: "articles", id: draft.id,
    data: {
      assignedEditor: editor.id,
      editorComments: [{ anchor: "intro", createdBy: editor.id, message: "Ordinary site-field save", resolved: false }],
    },
    depth: 0, draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(relationID(ordinarySiteSave.assignedEditor), editor.id);
  assert.equal(ordinarySiteSave.curationStatus, ordinaryProtectedBefore.curationStatus);
  assert.equal(ordinarySiteSave.publicationStatus, ordinaryProtectedBefore.publicationStatus);
  assert.equal(ordinarySiteSave.workflowStatus, ordinaryProtectedBefore.workflowStatus);
  assert.equal(relationID(ordinarySiteSave.owner), relationID(ordinaryProtectedBefore.owner));
  assert.equal(relationID(ordinarySiteSave.author), relationID(ordinaryProtectedBefore.author));
  assert.equal(ordinarySiteSave.locale, ordinaryProtectedBefore.locale);
  assert.equal(ordinarySiteSave.translationGroup, ordinaryProtectedBefore.translationGroup);
  assert.equal((await payload.count({ collection: "workflow-events", overrideAccess: true, where: { article: { equals: draft.id } } })).totalDocs, ordinaryEventsBefore.totalDocs, "An ordinary site-field save must not create a workflow or notification event.");
  const curated = await payload.update({
    collection: "articles", id: draft.id, data: { curationStatus: "curated" },
    draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(curated.id, draft.id);
  assert.equal(curated.curationStatus, "curated");
  assert.equal(relationID(curated.author), memberPerson.id);
  assert.equal(buildPublicationSummary(await payload.findByID({ collection: "articles", id: draft.id, depth: 2, draft: true, overrideAccess: true })).url, "/en/posts/member-direct-post");
  assert.equal(prepared.id, curated.id);
  await expectRejected(() => payload.update({
    collection: "articles", id: draft.id, data: { sourceNotes: [] },
    draft: false, overrideAccess: false, user: editor,
  }), "A curated Article cannot be left incomplete by an ordinary site-field save.");
  const curatedAfterRejectedSave = await payload.findByID({ collection: "articles", id: draft.id, depth: 0, draft: false, overrideAccess: true });
  assert.equal(curatedAfterRejectedSave.curationStatus, "curated");
  assert.equal(curatedAfterRejectedSave.sourceNotes?.length, 1);
  const otherMemberCuratedRead = await payload.findByID({
    collection: "articles", id: draft.id, depth: 0, overrideAccess: false, user: other,
  });
  assert.equal(otherMemberCuratedRead.sourceNotes?.[0]?.label, "Acceptance source");
  assert.equal(otherMemberCuratedRead.sourceNotes?.[0]?.check, undefined);

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
  const editorUpdated = await payload.update({
    collection: "articles", id: editorDraft.id,
    context: { memberPublicationConfirmed: true },
    data: { title: "Editor as member updated" }, draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(editorUpdated.title, "Editor as member updated");
  const editorWithdrawn = await payload.update({
    collection: "articles", id: editorDraft.id,
    context: { publicationTransitionConfirmed: true },
    data: { publicationStatus: "withdrawn" }, draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(editorWithdrawn.publicationStatus, "withdrawn");
  const editorRepublished = await payload.update({
    collection: "articles", id: editorDraft.id,
    context: { memberPublicationConfirmed: true, publicationTransitionConfirmed: true },
    data: { publicationStatus: "published" }, draft: false, overrideAccess: false, user: editor,
  });
  assert.equal(editorRepublished.publicationStatus, "published");
  assert.equal(relationID(editorRepublished.author), editorPerson.id);

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

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
