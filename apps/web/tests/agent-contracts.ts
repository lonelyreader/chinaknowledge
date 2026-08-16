import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  AGENT_BODY_V2_VERSION,
  AGENT_BODY_VERSION,
  AGENT_RESULT_VERSION,
  agentFailure,
  agentSuccess,
  agentToolDescriptions,
  requireIdempotencyKey,
  requireRevision,
  type AgentArticleBodyV1,
  type AgentArticleBodyV2,
} from "../src/agent/contracts";
import {
  agentBodyToLexical,
  agentBodyToMarkdown,
  lexicalToAgentBody,
  lexicalToAgentBodyV2,
  UnsupportedAgentContentError,
} from "../src/agent/content";
import { articleRevisionMatches, createArticleRevision, createPersonRevision, personRevisionMatches } from "../src/agent/revision";
import {
  createHomepageScheduleConfirmation,
  createMajorEditNotificationConfirmation,
  createProfilePublicationConfirmation,
  createPublicationConfirmation,
  createSiteSelectionConfirmation,
  homepageScheduleConfirmationDigest,
  majorEditNotificationConfirmationDigest,
  majorEditRecipientDigest,
  PublicationConfirmationError,
  publicationConfirmationDigest,
  profilePublicationConfirmationDigest,
  readHomepageScheduleConfirmation,
  readMajorEditNotificationConfirmation,
  readProfilePublicationConfirmation,
  readPublicationConfirmation,
  readSiteSelectionConfirmation,
  siteSelectionConfirmationDigest,
} from "../src/agent/confirmation";

const body: AgentArticleBodyV1 = {
  version: AGENT_BODY_VERSION,
  blocks: [
    { type: "heading", level: 2, children: [{ type: "text", text: "A working copy" }] },
    {
      type: "paragraph",
      children: [
        { type: "text", text: "Written ", marks: { italic: true } },
        { type: "link", url: "https://example.test/source", children: [{ type: "text", text: "with a source" }] },
        { type: "text", text: "." },
      ],
    },
    {
      type: "list",
      style: "bullet",
      items: [
        { children: [{ type: "text", text: "First fact", marks: { bold: true } }] },
        { children: [{ type: "text", text: "Second fact" }] },
      ],
    },
  ],
};

const lexical = agentBodyToLexical(body);
assert.deepEqual(lexicalToAgentBody(lexical.root), body);
assert.equal(
  agentBodyToMarkdown(body),
  "## A working copy\n\n*Written *[with a source](https://example.test/source).\n\n- **First fact**\n- Second fact",
);

assert.throws(
  () => lexicalToAgentBody({ type: "root", children: [{ type: "upload", value: 1 }] }),
  UnsupportedAgentContentError,
);
assert.throws(
  () => lexicalToAgentBody({
    type: "root",
    children: [{ type: "paragraph", children: [{ type: "text", text: "underlined", format: 8 }] }],
  }),
  UnsupportedAgentContentError,
);

// INFRA-AGENT-MEDIA-001: AgentArticleBodyV2 adds image and youtube blocks.
const bodyV2: AgentArticleBodyV2 = {
  version: AGENT_BODY_V2_VERSION,
  blocks: [
    { type: "heading", level: 2, children: [{ type: "text", text: "With media" }] },
    { type: "image", mediaId: 31, alt: "A rice terrace at dawn", caption: "Yunnan" },
    { type: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { type: "paragraph", children: [{ type: "text", text: "Done." }] },
  ],
};
const lexicalV2 = agentBodyToLexical(bodyV2);
assert.deepEqual(
  lexicalToAgentBodyV2(lexicalV2.root, { mediaAlt: (id) => (id === 31 ? "A rice terrace at dawn" : null) }),
  bodyV2,
);
assert.equal(
  agentBodyToMarkdown(bodyV2),
  '## With media\n\n![A rice terrace at dawn](media:31 "Yunnan")\n\n[YouTube video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)\n\nDone.',
);
// The V1 reader keeps failing explicitly on media nodes — never a silent drop.
assert.throws(() => lexicalToAgentBody(lexicalV2.root), UnsupportedAgentContentError);
// The V1 body version cannot smuggle V2 blocks into a write.
assert.throws(
  () => agentBodyToLexical({ version: AGENT_BODY_VERSION, blocks: [{ type: "image", mediaId: 31, alt: "x" }] } as never),
  /AgentArticleBodyV1 does not support "image" blocks/,
);
// The V2 reader requires readable media with an alt description.
assert.throws(
  () => lexicalToAgentBodyV2(lexicalV2.root, { mediaAlt: () => null }),
  UnsupportedAgentContentError,
);
// Non-whitelisted embed URLs fail in both directions, matching the web editor.
assert.throws(
  () => agentBodyToLexical({ version: AGENT_BODY_V2_VERSION, blocks: [{ type: "youtube", url: "https://vimeo.com/123456" }] }),
  /Only YouTube video links/,
);
assert.throws(
  () => lexicalToAgentBodyV2(
    { type: "root", children: [{ type: "block", fields: { blockType: "youtubeEmbed", url: "https://vimeo.com/123456" } }] },
    { mediaAlt: () => null },
  ),
  UnsupportedAgentContentError,
);
// Non-YouTube block embeds and image blocks without valid media IDs fail explicitly.
assert.throws(
  () => lexicalToAgentBodyV2(
    { type: "root", children: [{ type: "block", fields: { blockType: "otherEmbed", url: "https://example.test" } }] },
    { mediaAlt: () => null },
  ),
  UnsupportedAgentContentError,
);
assert.throws(
  () => agentBodyToLexical({ version: AGENT_BODY_V2_VERSION, blocks: [{ type: "image", mediaId: 0, alt: "x" }] }),
  /positive media ID/,
);
assert.throws(
  () => agentBodyToLexical({ version: AGENT_BODY_V2_VERSION, blocks: [{ type: "image", mediaId: 31, alt: "  " }] }),
  /alt description/,
);
// V1 bodies keep converting exactly as before through the shared writer.
assert.deepEqual(lexicalToAgentBody(agentBodyToLexical(body).root), body);

const source = { id: 42, locale: "en", updatedAt: "2026-07-31T09:00:00.000Z" };
const revision = createArticleRevision(source);
assert.match(revision, /^rev1_[A-Za-z0-9_-]{43}$/);
assert.equal(articleRevisionMatches(revision, source), true);
assert.equal(articleRevisionMatches(revision, { ...source, updatedAt: "2026-07-31T09:00:01.000Z" }), false);
assert.equal(requireRevision(revision), revision);
assert.throws(() => requireRevision("42:2026-07-31"), TypeError);

assert.equal(requireIdempotencyKey("save_01JZX8YT5CP0N7AX"), "save_01JZX8YT5CP0N7AX");
assert.throws(() => requireIdempotencyKey("short"), TypeError);
assert.throws(() => requireIdempotencyKey("bad key with spaces"), TypeError);

const success = agentSuccess({ articleId: "42" }, { requestId: "req_test", meta: { revision } });
assert.deepEqual(success, {
  version: AGENT_RESULT_VERSION,
  ok: true,
  requestId: "req_test",
  data: { articleId: "42" },
  meta: { revision },
});
const failure = agentFailure({ code: "REVISION_CONFLICT", message: "The article changed.", retryable: true }, {
  requestId: "req_test",
});
assert.equal(failure.ok, false);
assert.equal(failure.error?.code, "REVISION_CONFLICT");

for (const description of Object.values(agentToolDescriptions)) {
  assert.ok(description.length > 40);
  assert.ok(description.length <= 512);
}
assert.equal(Object.keys(agentToolDescriptions).length, 30);
assert.ok(agentToolDescriptions.media_upload);
assert.ok(agentToolDescriptions.article_set_cover);
assert.ok(agentToolDescriptions.my_profile_get);
assert.ok(agentToolDescriptions.my_links_save);
assert.ok(agentToolDescriptions.article_create_translation_draft);
assert.ok(agentToolDescriptions.editorial_attention_list);
assert.ok(agentToolDescriptions.editorial_reference_options);
assert.ok(agentToolDescriptions.editorial_save_site_fields);
assert.ok(agentToolDescriptions.editorial_prepare_homepage_schedule);
assert.ok(agentToolDescriptions.editorial_commit_homepage_schedule);
assert.ok(agentToolDescriptions.editorial_prepare_major_edit_notification);
assert.ok(agentToolDescriptions.editorial_commit_major_edit_notification);

const editorialRevisionSource = {
  ...source,
  assignedEditor: 9,
  coverImage: 31,
  editorComments: [{ id: "comment-a", anchor: "intro", message: "Check this.", resolved: false, createdBy: 9 }],
  format: "guide",
  freshnessDate: "2026-08-16",
  geographies: [14],
  homepagePlacement: "none",
  purposes: [11],
  situations: [15],
  sourceNotes: [{ id: "source-a", label: "Official", url: "https://example.test", checkedAt: null, check: "Checked" }],
  topics: [12],
};
const editorialRevision = createArticleRevision(editorialRevisionSource);
for (const changed of [
  { assignedEditor: 10 }, { coverImage: 32 }, { format: "analysis" }, { freshnessDate: "2026-08-17" },
  { geographies: [99] }, { purposes: [99] }, { situations: [99] }, { topics: [99] },
  { sourceNotes: [{ id: "source-a", label: "Changed" }] },
  { editorComments: [{ id: "comment-a", anchor: "intro", message: "Changed", resolved: false, createdBy: 9 }] },
  { owner: 99 }, { publicationStatus: "withdrawn" }, { curationStatus: "curated" }, { homepagePlacement: "lead" },
  { homepageStartsAt: "2026-08-17T00:00:00.000Z" }, { homepageEndsAt: "2026-08-18T00:00:00.000Z" },
]) {
  assert.equal(articleRevisionMatches(editorialRevision, { ...editorialRevisionSource, ...changed }), false);
}
assert.equal(articleRevisionMatches(editorialRevision, {
  ...editorialRevisionSource,
  assignedEditor: { id: 9 }, coverImage: { id: 31 }, geographies: [{ id: 14 }], purposes: [{ id: 11 }], situations: [{ id: 15 }], topics: [{ id: 12 }],
}), true);

const personSource = {
  id: 8,
  updatedAt: "2026-08-16T09:00:00.000Z",
  name: "Fixture Member",
  portrait: { id: 31 },
  topics: [{ id: 11 }],
  languages: ["en"],
  identity: "Writer",
  city: "Shanghai",
  introduction: "Fixture introduction",
  canHelpWith: [{ id: "payload-row-a", item: "Research" }],
  links: [{ id: "payload-row-b", type: "x", label: "X", url: "https://x.com/fixture" }],
  profileStatus: "draft",
};
const personRevision = createPersonRevision(personSource);
assert.match(personRevision, /^rev1_[A-Za-z0-9_-]{43}$/);
assert.equal(personRevisionMatches(personRevision, { ...personSource, canHelpWith: [{ id: "different-row", item: "Research" }], links: [{ id: "different-link-row", type: "x", label: "X", url: "https://x.com/fixture" }] }), true);
assert.equal(personRevisionMatches(personRevision, { ...personSource, profileStatus: "public" }), false);
assert.equal(personRevisionMatches(personRevision, { ...personSource, portrait: { id: 32 } }), false);

const confirmationSecret = "fixture-publication-secret-at-least-32-characters";
const confirmationPayload = {
  action: "publish" as const,
  articleId: 42,
  connectionId: 7,
  exp: Date.now() + 60_000,
  jti: randomUUID(),
  personId: 8,
  revision,
  targetStatus: "published" as const,
  userId: 9,
  v: 1 as const,
};
const confirmation = createPublicationConfirmation(confirmationPayload, confirmationSecret);
assert.deepEqual(readPublicationConfirmation(confirmation, { secret: confirmationSecret }), confirmationPayload);
assert.match(publicationConfirmationDigest(confirmation), /^confirm_[A-Za-z0-9_-]{43}$/);
assert.equal(publicationConfirmationDigest(confirmation), publicationConfirmationDigest(confirmation));
assert.throws(
  () => readPublicationConfirmation(`${confirmation.slice(0, -1)}x`, { secret: confirmationSecret }),
  PublicationConfirmationError,
);
assert.throws(
  () => readPublicationConfirmation(confirmation, { now: confirmationPayload.exp + 1, secret: confirmationSecret }),
  (error: unknown) => error instanceof PublicationConfirmationError && error.reason === "expired",
);
assert.deepEqual(
  readPublicationConfirmation(confirmation, { allowExpired: true, now: confirmationPayload.exp + 1, secret: confirmationSecret }),
  confirmationPayload,
);

const siteSelectionPayload = {
  action: "add_to_site" as const,
  articleId: 42,
  connectionId: 7,
  exp: Date.now() + 60_000,
  jti: randomUUID(),
  personId: 8,
  revision,
  targetStatus: "curated" as const,
  userId: 9,
  v: 1 as const,
};
const siteSelectionConfirmation = createSiteSelectionConfirmation(siteSelectionPayload, confirmationSecret);
assert.deepEqual(readSiteSelectionConfirmation(siteSelectionConfirmation, { secret: confirmationSecret }), siteSelectionPayload);
assert.match(siteSelectionConfirmationDigest(siteSelectionConfirmation), /^site_confirm_[A-Za-z0-9_-]{43}$/);
assert.throws(
  () => readSiteSelectionConfirmation(`${siteSelectionConfirmation.slice(0, -1)}x`, { secret: confirmationSecret }),
  PublicationConfirmationError,
);

const profileConfirmationPayload = {
  action: "publish" as const,
  connectionId: 7,
  exp: Date.now() + 60_000,
  jti: randomUUID(),
  personId: 8,
  revision: personRevision,
  role: "author" as const,
  targetStatus: "public" as const,
  userId: 9,
  v: 1 as const,
};
const profileConfirmation = createProfilePublicationConfirmation(profileConfirmationPayload, confirmationSecret);
assert.deepEqual(readProfilePublicationConfirmation(profileConfirmation, { secret: confirmationSecret }), profileConfirmationPayload);
assert.match(profilePublicationConfirmationDigest(profileConfirmation), /^profile_confirm_[A-Za-z0-9_-]{43}$/);
assert.throws(() => readProfilePublicationConfirmation(`${profileConfirmation.slice(0, -1)}x`, { secret: confirmationSecret }), PublicationConfirmationError);
assert.throws(
  () => readProfilePublicationConfirmation(profileConfirmation, { now: profileConfirmationPayload.exp + 1, secret: confirmationSecret }),
  (error: unknown) => error instanceof PublicationConfirmationError && error.reason === "expired",
);
assert.throws(() => readPublicationConfirmation(profileConfirmation, { secret: confirmationSecret }), PublicationConfirmationError);
assert.throws(() => readProfilePublicationConfirmation(confirmation, { secret: confirmationSecret }), PublicationConfirmationError);
assert.throws(
  () => readSiteSelectionConfirmation(siteSelectionConfirmation, { now: siteSelectionPayload.exp + 1, secret: confirmationSecret }),
  (error: unknown) => error instanceof PublicationConfirmationError && error.reason === "expired",
);

const homepageConfirmationPayload = {
  articleId: 42,
  connectionId: 7,
  endsAt: "2026-08-18T00:00:00.000Z",
  exp: Date.now() + 60_000,
  jti: randomUUID(),
  personId: 8,
  placement: "lead" as const,
  previousEndsAt: null,
  previousPlacement: "none" as const,
  previousStartsAt: null,
  revision,
  role: "editor" as const,
  startsAt: "2026-08-17T00:00:00.000Z",
  userId: 9,
  v: 1 as const,
};
const homepageConfirmation = createHomepageScheduleConfirmation(homepageConfirmationPayload, confirmationSecret);
assert.deepEqual(readHomepageScheduleConfirmation(homepageConfirmation, { secret: confirmationSecret }), homepageConfirmationPayload);
assert.match(homepageScheduleConfirmationDigest(homepageConfirmation), /^homepage_confirm_[A-Za-z0-9_-]{43}$/);
assert.throws(() => readHomepageScheduleConfirmation(`${homepageConfirmation.slice(0, -1)}x`, { secret: confirmationSecret }), PublicationConfirmationError);
assert.throws(
  () => readHomepageScheduleConfirmation(homepageConfirmation, { now: homepageConfirmationPayload.exp + 1, secret: confirmationSecret }),
  (error: unknown) => error instanceof PublicationConfirmationError && error.reason === "expired",
);
assert.throws(() => readMajorEditNotificationConfirmation(homepageConfirmation, { secret: confirmationSecret }), PublicationConfirmationError);

const recipientDigest = majorEditRecipientDigest("member@example.test", confirmationSecret);
assert.match(recipientDigest, /^recipient_[A-Za-z0-9_-]{43}$/);
assert.equal(recipientDigest, majorEditRecipientDigest(" MEMBER@example.test ", confirmationSecret));
const notificationConfirmationPayload = {
  action: "major_edit" as const,
  articleId: 42,
  connectionId: 7,
  exp: Date.now() + 60_000,
  jti: randomUUID(),
  ownerId: 10,
  personId: 8,
  recipientDigest,
  revision,
  role: "editor" as const,
  userId: 9,
  v: 1 as const,
};
const notificationConfirmation = createMajorEditNotificationConfirmation(notificationConfirmationPayload, confirmationSecret);
assert.deepEqual(readMajorEditNotificationConfirmation(notificationConfirmation, { secret: confirmationSecret }), notificationConfirmationPayload);
assert.match(majorEditNotificationConfirmationDigest(notificationConfirmation), /^notification_confirm_[A-Za-z0-9_-]{43}$/);
assert.throws(() => readMajorEditNotificationConfirmation(`${notificationConfirmation.slice(0, -1)}x`, { secret: confirmationSecret }), PublicationConfirmationError);
assert.throws(
  () => readMajorEditNotificationConfirmation(notificationConfirmation, { now: notificationConfirmationPayload.exp + 1, secret: confirmationSecret }),
  (error: unknown) => error instanceof PublicationConfirmationError && error.reason === "expired",
);
assert.throws(() => readHomepageScheduleConfirmation(notificationConfirmation, { secret: confirmationSecret }), PublicationConfirmationError);
assert.throws(() => readMajorEditNotificationConfirmation(siteSelectionConfirmation, { secret: confirmationSecret }), PublicationConfirmationError);

console.log("Agent contract tests PASS");
