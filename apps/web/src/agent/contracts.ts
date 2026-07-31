import { randomUUID } from "node:crypto";

export const AGENT_RESULT_VERSION = "AgentToolResultV1" as const;
export const AGENT_BODY_VERSION = "AgentArticleBodyV1" as const;

export const agentErrorCodes = [
  "UNAUTHENTICATED",
  "CONNECTION_REVOKED",
  "ACCOUNT_PAUSED",
  "NO_PERSON",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "UNSUPPORTED_CONTENT",
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

export const agentToolDescriptions = {
  account_context:
    "Return the current China, in Fact account, linked Person, role and account state. This is read-only. The server rechecks the account and Person relationship on every call.",
  capabilities_list:
    "List the China, in Fact tools currently allowed for this connection. Capabilities describe the present maximum only; every later call still checks account state, role and object ownership.",
  my_articles_list:
    "List the current member's own China, in Fact articles with minimal status, locale and revision fields. It never returns another member's private article or hidden editorial fields.",
  article_get_working_copy:
    "Return one article owned by the current member as an AgentArticleBodyV1 working copy with locale and revision. Unsupported rich-text nodes fail explicitly instead of being silently removed.",
  article_create_draft:
    "Create a private article draft for the current member. The server fixes owner, author, translation identity and initial states. Requires an idempotency key and never publishes content.",
  article_save_draft:
    "Save allowed writing fields on a private article owned by the current member. Requires the latest revision and an idempotency key; stale revisions fail without overwriting newer work.",
  article_preview:
    "Return an authenticated preview path for an article owned by the current member. This is read-only and never creates or changes a public URL or publication state.",
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
