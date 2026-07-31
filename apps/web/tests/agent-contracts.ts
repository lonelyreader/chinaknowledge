import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  AGENT_BODY_VERSION,
  AGENT_RESULT_VERSION,
  agentFailure,
  agentSuccess,
  agentToolDescriptions,
  requireIdempotencyKey,
  requireRevision,
  type AgentArticleBodyV1,
} from "../src/agent/contracts";
import {
  agentBodyToLexical,
  agentBodyToMarkdown,
  lexicalToAgentBody,
  UnsupportedAgentContentError,
} from "../src/agent/content";
import { articleRevisionMatches, createArticleRevision } from "../src/agent/revision";
import {
  createPublicationConfirmation,
  PublicationConfirmationError,
  publicationConfirmationDigest,
  readPublicationConfirmation,
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
assert.equal(Object.keys(agentToolDescriptions).length, 9);

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

console.log("Agent contract tests PASS");
