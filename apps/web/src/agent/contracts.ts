import { randomUUID } from "node:crypto";

export const AGENT_RESULT_VERSION = "AgentToolResultV1" as const;
export const AGENT_BODY_VERSION = "AgentArticleBodyV1" as const;
export const AGENT_BODY_V2_VERSION = "AgentArticleBodyV2" as const;

export const agentErrorCodes = [
  "UNAUTHENTICATED",
  "CONNECTION_REVOKED",
  "ACCOUNT_PAUSED",
  "NO_PERSON",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "UNSUPPORTED_CONTENT",
  "CONFIRMATION_EXPIRED",
  "CONFIRMATION_INVALID",
  "CONFIRMATION_USED",
  "REVISION_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
  "RATE_LIMITED",
  "TEMPORARY_FAILURE",
  "INTERNAL_ERROR",
] as const;

export type AgentErrorCode = (typeof agentErrorCodes)[number];

export type AgentToolError = {
  code: AgentErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
};

export type AgentToolMeta = {
  auditId?: string;
  idempotencyKey?: string;
  objectId?: string;
  readAfterWrite?: boolean;
  revision?: string;
};

export type AgentToolResultV1<T> = {
  version: typeof AGENT_RESULT_VERSION;
  ok: boolean;
  requestId: string;
  data?: T;
  error?: AgentToolError;
  meta?: AgentToolMeta;
};

export type AgentTextMarks = {
  bold?: true;
  code?: true;
  italic?: true;
  strike?: true;
};

export type AgentInline =
  | { type: "text"; text: string; marks?: AgentTextMarks }
  | { type: "link"; url: string; children: Array<Extract<AgentInline, { type: "text" }>> }
  | { type: "break" };

export type AgentBlock =
  | { type: "paragraph"; children: AgentInline[] }
  | { type: "heading"; level: 2 | 3 | 4; children: AgentInline[] }
  | { type: "quote"; children: AgentInline[] }
  | {
      type: "list";
      style: "bullet" | "number";
      items: Array<{ children: AgentInline[] }>;
    };

export type AgentArticleBodyV1 = {
  version: typeof AGENT_BODY_VERSION;
  blocks: AgentBlock[];
};

export type AgentImageBlock = {
  type: "image";
  mediaId: number;
  alt: string;
  caption?: string;
};

export type AgentYouTubeBlock = {
  type: "youtube";
  url: string;
  caption?: string;
};

export type AgentBlockV2 = AgentBlock | AgentImageBlock | AgentYouTubeBlock;

export type AgentArticleBodyV2 = {
  version: typeof AGENT_BODY_V2_VERSION;
  blocks: AgentBlockV2[];
};

export type AgentArticleBody = AgentArticleBodyV1 | AgentArticleBodyV2;

export const agentToolDescriptions = {
  account_context:
    "Return the current China, in Fact account, linked Person, role and account state. This is read-only. The server rechecks the account and Person relationship on every call.",
  capabilities_list:
    "List the China, in Fact tools currently allowed for this connection. Capabilities describe the present maximum only; every later call still checks account state, role and object ownership.",
  my_profile_get:
    "Return the current member's editable Person profile, links, publication state, completeness, public path, authenticated preview path and latest revision. This is read-only and never exposes another Person or editorial-only fields.",
  my_profile_save:
    "Save only the current member's allowed Person profile fields. The server derives the Person from the connection, validates portrait and topic relationships, and requires the latest revision plus an idempotency key. It cannot change links, ownership, slug, editorial fields or visibility.",
  my_links_save:
    "Replace the current member's ordered profile link list with 0-8 validated links. The server derives the Person from the connection and requires the latest revision plus an idempotency key. It cannot change profile content, ownership or visibility.",
  my_profile_prepare_publication:
    "Prepare making the current member's profile public or draft. It validates the current profile and returns an exact summary plus a short-lived one-time confirmation reference without changing profile visibility.",
  my_profile_commit_publication:
    "Execute a prepared profile visibility action only after explicit confirmation. The server rechecks the current connection, Person relationship, revision, profile requirements and public Article constraints before changing visibility.",
  my_articles_list:
    "List a bounded page of the current member's own China, in Fact articles with status, locale, revision and translation-pair state. Optional locale and publication-status filters apply only within that member boundary.",
  my_media_list:
    "List a bounded page of images uploaded by the current member with safe metadata. It never returns another member's private upload or changes approval state.",
  article_get_working_copy:
    "Return one article owned by the current member as a working copy with locale and revision. The default AgentArticleBodyV1 body is text-only; request AgentArticleBodyV2 to include image and YouTube blocks. Unsupported rich-text nodes fail explicitly instead of being silently removed.",
  article_create_draft:
    "Create a private article draft for the current member. The server fixes owner, author, translation identity and initial states. Requires an idempotency key and never publishes content.",
  article_create_translation_draft:
    "Create the missing opposite-locale private draft for one Article owned by the current member, or return the existing paired draft. The server derives target locale and translation identity, serializes concurrent requests and requires an idempotency key.",
  article_save_draft:
    "Save allowed writing fields on a private article owned by the current member. Requires the latest revision and an idempotency key; stale revisions fail without overwriting newer work.",
  article_preview:
    "Return an authenticated preview path for an article owned by the current member, plus structured pre-publication warnings: missing cover, missing summary, heading level jumps and body media the member may not publish. This is read-only and never creates or changes a public URL or publication state.",
  media_upload:
    "Upload one image for the current member through the site's standard unique-filename media pipeline. The file becomes a Media item owned by the uploader with the given accessibility description, and the tool returns the media ID plus the member's own read-only metadata. It never approves media for public use and cannot touch another member's media.",
  article_set_cover:
    "Set the cover image of an article owned by the current member. The server only accepts media uploaded by that member or media already approved for public use, requires the latest revision and an idempotency key, and never changes publication state or another member's article.",
  article_prepare_publication:
    "Prepare publishing, updating the public version, withdrawing or republishing an article owned by the current member, or a site-authored article when the caller is a Super Admin. This validates the action and returns an exact summary plus a short-lived one-time confirmation reference. It never changes the article or public page.",
  article_commit_publication:
    "Execute a prepared publication action only after the user explicitly confirms the exact prepare summary. Requires the one-time confirmation reference, its revision and a new idempotency key. The server rechecks owner or Super Admin site authority, account state, connection, revision and transition before changing the public page.",
  editorial_article_get:
    "Return one exact article for a current Editor or Super Admin with Body V1 or V2, editable site fields, public-effect state and latest revision. It never grants Member publication control or changes the article.",
  editorial_attention_list:
    "List a bounded page of member-public articles in the fixed Needs attention queue for a current Editor or Super Admin. Locale and self-derived assignee filters are limited; arbitrary status, owner, where and sort input is not accepted.",
  editorial_reference_options:
    "Return one bounded, searchable reference whitelist needed by editorial site-field saves: permitted assignees, one taxonomy dimension or approved public cover media. It never exposes arbitrary collections, private media or unrelated User details.",
  editorial_save_site_fields:
    "Save only allowed site fields on one existing member-authored article for a current Editor or Super Admin. It requires the latest revision and an idempotency key, validates every reference, preserves writing, identity and workflow states, sends no notification, and reads back the saved fields.",
  editorial_prepare_site_selection:
    "Prepare adding one member-public article to the site's editorial selection, or removing that same selected article as recovery. It returns a server-generated impact summary and short-lived one-time confirmation reference without changing the article or public entry.",
  editorial_commit_site_selection:
    "Execute a prepared site-selection action only after the user explicitly confirms the server summary. Requires the one-time confirmation reference, its revision and a new idempotency key. The server rechecks the current role, connection, article, transition, revision and curation requirements before changing the site entry.",
  editorial_prepare_homepage_schedule:
    "Prepare scheduling one already-public, site-selected article for the homepage, or clearing its schedule. It returns the exact target, current values and recovery values with a short-lived confirmation reference, without changing the Article or publishing a pending draft.",
  editorial_commit_homepage_schedule:
    "Execute one prepared homepage schedule only after explicit confirmation. It rechecks the current role, connection, Article revision, live publication and curation state, and rejects any pending draft before changing only the three homepage schedule fields.",
  editorial_prepare_major_edit_notification:
    "Prepare one fixed major-edit notification for the current owner of a Member Article. The server derives the recipient and copy, returns only a safe account-email impact summary, and creates no WorkflowEvent or external delivery.",
  editorial_commit_major_edit_notification:
    "Execute a prepared major-edit author notification. The server derives the recipient and copy, creates or reuses one WorkflowEvent and notification key, and safely reads back or retries that same event without exposing email or sending an already completed notification again.",
  editorial_release_site_article_batch:
    "Publish and add 1-20 site-authored Articles to the site after the user has explicitly approved that exact batch. Super Admin only. The server processes Articles serially through the normal prepare, confirmation, idempotency, revision and readback gates; it stops on the first failure and never edits article copy.",
  admin_recent_activity:
    "Return the latest 20 Article workflow activity items for a current Super Admin. This is read-only and exposes only minimal Article, actor, status, notification state and time fields.",
} as const;

export type AgentToolName = keyof typeof agentToolDescriptions;

export function createAgentRequestId() {
  return `req_${randomUUID()}`;
}

export function agentSuccess<T>(
  data: T,
  options: { requestId?: string; meta?: AgentToolMeta } = {},
): AgentToolResultV1<T> {
  return {
    version: AGENT_RESULT_VERSION,
    ok: true,
    requestId: options.requestId ?? createAgentRequestId(),
    data,
    ...(options.meta ? { meta: options.meta } : {}),
  };
}

export function agentFailure(
  error: AgentToolError,
  options: { requestId?: string; meta?: AgentToolMeta } = {},
): AgentToolResultV1<never> {
  return {
    version: AGENT_RESULT_VERSION,
    ok: false,
    requestId: options.requestId ?? createAgentRequestId(),
    error,
    ...(options.meta ? { meta: options.meta } : {}),
  };
}

export function requireIdempotencyKey(value: unknown) {
  if (
    typeof value !== "string"
    || value.length < 16
    || value.length > 128
    || !/^[A-Za-z0-9._:-]+$/.test(value)
  ) {
    throw new TypeError(
      "idempotencyKey must be 16-128 characters using letters, numbers, dot, underscore, colon or dash.",
    );
  }
  return value;
}

export function requireRevision(value: unknown) {
  if (typeof value !== "string" || !/^rev1_[A-Za-z0-9_-]{43}$/.test(value)) {
    throw new TypeError("revision must be an Agent revision token.");
  }
  return value;
}
