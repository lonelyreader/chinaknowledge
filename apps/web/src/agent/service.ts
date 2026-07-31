import { createHash } from "node:crypto";

import { sql } from "@payloadcms/db-postgres";
import config from "@payload-config";
import type { AuthInfo } from "@modelcontextprotocol/server";
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
} from "payload";

import type { AgentEvent, Article, User } from "@/payload-types";

import {
  agentBodyToLexical,
  agentBodyToMarkdown,
  lexicalToAgentBody,
  UnsupportedAgentContentError,
} from "./content";
import {
  agentFailure,
  agentSuccess,
  createAgentRequestId,
  requireIdempotencyKey,
  requireRevision,
  type AgentArticleBodyV1,
  type AgentErrorCode,
  type AgentToolName,
} from "./contracts";
import { createArticleRevision } from "./revision";

type Actor = {
  clientFamily: string;
  connectionId: number;
  personId: number;
  role: string;
  userId: number;
};

type WriteContext = {
  idempotencyKey: string;
  tool: "article_create_draft" | "article_save_draft";
};

class AgentServiceError extends Error {
  constructor(readonly code: AgentErrorCode, message: string, readonly details?: Record<string, unknown>) {
    super(message);
  }
}

class IdempotencyReservationError extends Error {
  constructor(readonly original: unknown) {
    super("The idempotency reservation could not be created.");
  }
}

function actorFromAuth(auth: AuthInfo): Actor {
  const extra = auth.extra ?? {};
  const actor = {
    clientFamily: String(extra.clientFamily ?? "unknown"),
    connectionId: Number(extra.connectionId),
    personId: Number(extra.personId),
    role: String(extra.role ?? "author"),
    userId: Number(extra.userId),
  };
  if (
    !Number.isInteger(actor.connectionId) || actor.connectionId <= 0
    || !Number.isInteger(actor.personId) || actor.personId <= 0
    || !Number.isInteger(actor.userId) || actor.userId <= 0
  ) {
    throw new AgentServiceError("UNAUTHENTICATED", "The Agent connection is invalid.");
  }
  return actor;
}

function relationId(value: number | { id: number }) {
  return typeof value === "number" ? value : value.id;
}

function revision(article: Article) {
  return createArticleRevision(article);
}

function articleSummary(article: Article) {
  return {
    id: article.id,
    title: article.title,
    locale: article.locale,
    publicationStatus: article.publicationStatus,
    curationStatus: article.curationStatus,
    revision: revision(article),
    updatedAt: article.updatedAt,
  };
}

function failure(error: unknown, requestId = createAgentRequestId()) {
  if (error instanceof AgentServiceError) {
    return agentFailure({ code: error.code, message: error.message, retryable: error.code === "TEMPORARY_FAILURE", details: error.details }, { requestId });
  }
  if (error instanceof UnsupportedAgentContentError) {
    return agentFailure({ code: "UNSUPPORTED_CONTENT", message: error.message, retryable: false }, { requestId });
  }
  if (error instanceof TypeError) {
    return agentFailure({ code: "VALIDATION_ERROR", message: error.message, retryable: false }, { requestId });
  }
  return agentFailure({ code: "INTERNAL_ERROR", message: "The request could not be completed.", retryable: false }, { requestId });
}

function idempotentRequestId(actor: Actor, input: WriteContext) {
  const key = requireIdempotencyKey(input.idempotencyKey);
  return `idem_${createHash("sha256").update(`${actor.connectionId}\0${input.tool}\0${key}`).digest("base64url")}`;
}

function canonicalJSON(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJSON(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function inputFingerprint(value: unknown) {
  return createHash("sha256").update(canonicalJSON(value)).digest("base64url");
}

export class AgentMemberService {
  private constructor(private payload: Payload, private actor: Actor) {}

  static async create(auth: AuthInfo) {
    return AgentMemberService.fromPayload(await getPayload({ config }), auth);
  }

  static fromPayload(payload: Payload, auth: AuthInfo) {
    return new AgentMemberService(payload, actorFromAuth(auth));
  }

  private async currentUser() {
    const user = await this.payload.findByID({ collection: "users", id: this.actor.userId, depth: 0, overrideAccess: true });
    if (user.accountStatus === "paused") throw new AgentServiceError("ACCOUNT_PAUSED", "This account is paused.");
    const people = await this.payload.find({ collection: "people", depth: 0, limit: 1, overrideAccess: true, pagination: false, where: { and: [{ id: { equals: this.actor.personId } }, { user: { equals: user.id } }] } });
    if (!people.docs[0]) throw new AgentServiceError("NO_PERSON", "This account is not linked to a Person.");
    return user as User;
  }

  private async ownedArticle(id: number, user: User, req?: PayloadRequest) {
    let article: Article;
    try {
      article = await this.payload.findByID({ collection: "articles", id, depth: 0, draft: true, overrideAccess: false, req, user });
    } catch {
      throw new AgentServiceError("NOT_FOUND", "Article not found.");
    }
    if (String(relationId(article.owner)) !== String(user.id)) throw new AgentServiceError("FORBIDDEN", "This article is not owned by the current member.");
    return article;
  }

  async accountContext() {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      await this.auditAttempt({ objectType: "account", requestId, result: "success", tool: "account_context" });
      return agentSuccess({ userId: user.id, personId: this.actor.personId, role: user.role, accountStatus: user.accountStatus }, { requestId });
    } catch (error) {
      await this.auditReadFailure("account_context", requestId, error);
      return failure(error, requestId);
    }
  }

  async capabilities() {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      await this.auditAttempt({ objectType: "account", requestId, result: "success", tool: "capabilities_list" });
      return agentSuccess({
        tools: ["account_context", "capabilities_list", "my_articles_list", "article_get_working_copy", "article_create_draft", "article_save_draft", "article_preview"],
        role: user.role,
      }, { requestId });
    } catch (error) {
      await this.auditReadFailure("capabilities_list", requestId, error);
      return failure(error, requestId);
    }
  }

  async myArticles() {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      const result = await this.payload.find({ collection: "articles", depth: 0, draft: true, limit: 100, overrideAccess: true, pagination: false, sort: "-updatedAt", where: { owner: { equals: user.id } } });
      await this.auditAttempt({ objectType: "article", requestId, result: "success", tool: "my_articles_list" });
      return agentSuccess({ articles: result.docs.map(articleSummary) }, { requestId });
    } catch (error) {
      await this.auditReadFailure("my_articles_list", requestId, error);
      return failure(error, requestId);
    }
  }

  async workingCopy(id: number) {
    const requestId = createAgentRequestId();
    try {
      const article = await this.ownedArticle(id, await this.currentUser());
      const body = lexicalToAgentBody(article.body.root);
      await this.auditAttempt({ objectId: String(article.id), objectType: "article", requestId, result: "success", tool: "article_get_working_copy" });
      return agentSuccess({ ...articleSummary(article), summary: article.summary ?? null, body, markdown: agentBodyToMarkdown(body) }, { requestId, meta: { objectId: String(article.id), revision: revision(article) } });
    } catch (error) {
      await this.auditReadFailure("article_get_working_copy", requestId, error, String(id));
      return failure(error, requestId);
    }
  }

  private async priorWrite(requestId: string, req?: PayloadRequest) {
    const result = await this.payload.find({ collection: "agent-events", depth: 0, limit: 1, overrideAccess: true, pagination: false, req, showHiddenFields: true, where: { idempotencyDigest: { equals: requestId } } });
    return result.docs[0] as AgentEvent | undefined;
  }

  private async withWriteTransaction<T>(user: User, operation: (req: PayloadRequest) => Promise<T>) {
    const req = await createLocalReq({ user }, this.payload);
    const started = await initTransaction(req);
    if (!started) throw new AgentServiceError("TEMPORARY_FAILURE", "A safe write transaction could not be started.");
    try {
      const value = await operation(req);
      await commitTransaction(req);
      return value;
    } catch (error) {
      await killTransaction(req);
      throw error;
    }
  }

  private async lockArticle(req: PayloadRequest, id: number) {
    const transactionId = await req.transactionID;
    const db = transactionId
      ? (this.payload.db.sessions?.[String(transactionId)]?.db as { execute: (query: unknown) => Promise<{ rows?: { id: number }[] }> } | undefined)
      : undefined;
    if (!db) throw new AgentServiceError("TEMPORARY_FAILURE", "The article write transaction is unavailable.");
    const result = await db.execute(sql`SELECT id FROM articles WHERE id = ${id} FOR UPDATE`);
    if (!result.rows?.[0]) throw new AgentServiceError("NOT_FOUND", "Article not found.");
  }

  private async reserveWrite(input: { fingerprint: string; requestId: string; tool: AgentToolName }, req: PayloadRequest) {
    try {
      return await this.payload.create({
        collection: "agent-events",
        overrideAccess: true,
        req,
        data: {
          user: this.actor.userId,
          connection: this.actor.connectionId,
          clientFamily: this.actor.clientFamily,
          tool: input.tool,
          objectType: "article",
          requestId: input.requestId,
          idempotencyDigest: input.requestId,
          inputFingerprint: input.fingerprint,
          result: "pending",
          occurredAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw new IdempotencyReservationError(error);
    }
  }

  private async finishWrite(eventId: number | string, input: { afterRevision?: string; beforeRevision?: string; objectId?: string; result: "success" | "conflict" }, req: PayloadRequest) {
    await this.payload.update({
      collection: "agent-events",
      id: eventId,
      overrideAccess: true,
      req,
      data: input,
    });
  }

  private async replayedWrite(requestId: string, fingerprint: string, user: User) {
    const prior = await this.priorWrite(requestId);
    if (!prior) return null;
    if (prior.inputFingerprint !== fingerprint) {
      throw new AgentServiceError("IDEMPOTENCY_CONFLICT", "The idempotency key was already used with different input.");
    }
    if (prior.result === "conflict") {
      throw new AgentServiceError("REVISION_CONFLICT", "The article changed after this working copy was loaded.", { latestRevision: prior.beforeRevision });
    }
    if (prior.result !== "success" || !prior.objectId) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The previous write has no readable result.");
    }
    return this.ownedArticle(Number(prior.objectId), user);
  }

  private async auditAttempt(input: { objectId?: string; objectType: "account" | "article"; requestId: string; result: "success" | "denied" | "failed"; tool: AgentToolName }) {
    try {
      await this.payload.create({
        collection: "agent-events",
        overrideAccess: true,
        data: {
          user: this.actor.userId,
          connection: this.actor.connectionId,
          clientFamily: this.actor.clientFamily,
          tool: input.tool,
          objectType: input.objectType,
          objectId: input.objectId,
          requestId: input.requestId,
          result: input.result,
          occurredAt: new Date().toISOString(),
        },
      });
    } catch {
      // The original failure remains authoritative when the audit store is unavailable.
    }
  }

  private async auditReadFailure(tool: AgentToolName, requestId: string, error: unknown, objectId?: string) {
    const denied = error instanceof AgentServiceError && ["ACCOUNT_PAUSED", "FORBIDDEN", "NO_PERSON", "NOT_FOUND", "UNAUTHENTICATED"].includes(error.code);
    await this.auditAttempt({ objectId, objectType: tool === "account_context" || tool === "capabilities_list" ? "account" : "article", requestId, result: denied ? "denied" : "failed", tool });
  }

  async createDraft(input: { body: AgentArticleBodyV1; idempotencyKey: string; locale: "en" | "es"; summary?: string; title: string }) {
    let requestId = createAgentRequestId();
    try {
      requestId = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "article_create_draft" });
      const user = await this.currentUser();
      if (!input.title.trim() || input.title.length > 240) throw new AgentServiceError("VALIDATION_ERROR", "Title is required and must be at most 240 characters.");
      const fingerprint = inputFingerprint(input);
      const prior = await this.replayedWrite(requestId, fingerprint, user);
      if (prior) {
        const article = prior;
        return agentSuccess(articleSummary(article), { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(article.id), readAfterWrite: true, revision: revision(article) } });
      }
      let article: Article;
      try {
        article = await this.withWriteTransaction(user, async (req) => {
          const event = await this.reserveWrite({ fingerprint, requestId, tool: "article_create_draft" }, req);
          const created = await this.payload.create({ collection: "articles", draft: true, overrideAccess: false, req, user, data: { title: input.title.trim(), summary: input.summary?.trim(), body: agentBodyToLexical(input.body), locale: input.locale } as never });
          await this.finishWrite(event.id, { afterRevision: revision(created), objectId: String(created.id), result: "success" }, req);
          return created;
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedWrite(requestId, fingerprint, user);
        if (!replay) throw error.original;
        article = replay;
      }
      const afterRevision = revision(article);
      return agentSuccess(articleSummary(article), { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(article.id), readAfterWrite: true, revision: afterRevision } });
    } catch (error) {
      await this.auditAttempt({ objectType: "article", requestId, result: "failed", tool: "article_create_draft" });
      return failure(error, requestId);
    }
  }

  async saveDraft(input: { body: AgentArticleBodyV1; id: number; idempotencyKey: string; revision: string; summary?: string; title: string }) {
    let requestId = createAgentRequestId();
    try {
      requestId = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "article_save_draft" });
      const user = await this.currentUser();
      requireRevision(input.revision);
      if (!input.title.trim() || input.title.length > 240) throw new AgentServiceError("VALIDATION_ERROR", "Title is required and must be at most 240 characters.");
      const fingerprint = inputFingerprint(input);
      const prior = await this.replayedWrite(requestId, fingerprint, user);
      if (prior) {
        const article = prior;
        return agentSuccess(articleSummary(article), { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(article.id), readAfterWrite: true, revision: revision(article) } });
      }
      let outcome: { kind: "conflict"; revision: string } | { article: Article; kind: "saved" };
      try {
        outcome = await this.withWriteTransaction(user, async (req) => {
          const event = await this.reserveWrite({ fingerprint, requestId, tool: "article_save_draft" }, req);
          await this.lockArticle(req, input.id);
          const article = await this.ownedArticle(input.id, user, req);
          const beforeRevision = revision(article);
          if (input.revision !== beforeRevision) {
            await this.finishWrite(event.id, { beforeRevision, objectId: String(article.id), result: "conflict" }, req);
            return { kind: "conflict" as const, revision: beforeRevision };
          }
          const saved = await this.payload.update({
            collection: "articles",
            id: article.id,
            draft: true,
            overrideAccess: false,
            req,
            user,
            data: { title: input.title.trim(), summary: input.summary?.trim(), body: agentBodyToLexical(input.body) } as never,
          });
          await this.finishWrite(event.id, { afterRevision: revision(saved), beforeRevision, objectId: String(saved.id), result: "success" }, req);
          return { article: saved, kind: "saved" as const };
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedWrite(requestId, fingerprint, user);
        if (!replay) throw error.original;
        outcome = { article: replay, kind: "saved" };
      }
      if (outcome.kind === "conflict") {
        throw new AgentServiceError("REVISION_CONFLICT", "The article changed after this working copy was loaded.", { latestRevision: outcome.revision });
      }
      const saved = outcome.article;
      const afterRevision = revision(saved);
      return agentSuccess(articleSummary(saved), { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(saved.id), readAfterWrite: true, revision: afterRevision } });
    } catch (error) {
      if (!(error instanceof AgentServiceError && (error.code === "REVISION_CONFLICT" || error.code === "IDEMPOTENCY_CONFLICT"))) {
        await this.auditAttempt({ objectId: String(input.id), objectType: "article", requestId, result: "failed", tool: "article_save_draft" });
      }
      return failure(error, requestId);
    }
  }

  async preview(id: number) {
    const requestId = createAgentRequestId();
    try {
      const article = await this.ownedArticle(id, await this.currentUser());
      await this.auditAttempt({ objectId: String(article.id), objectType: "article", requestId, result: "success", tool: "article_preview" });
      return agentSuccess({ path: `/${article.locale}/posts/${article.slug}?preview=${encodeURIComponent(String(article.id))}`, expiresAt: null }, { requestId, meta: { objectId: String(article.id), revision: revision(article) } });
    } catch (error) {
      await this.auditReadFailure("article_preview", requestId, error, String(id));
      return failure(error, requestId);
    }
  }
}
