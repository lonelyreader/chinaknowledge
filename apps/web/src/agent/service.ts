import { createHash, randomUUID } from "node:crypto";

import { sql } from "@payloadcms/db-postgres";
import config from "@payload-config";
import type { AuthInfo } from "@modelcontextprotocol/server";
import {
  commitTransaction,
  createLocalReq,
  getPayload,
  initTransaction,
  killTransaction,
  APIError,
  type Payload,
  type PayloadRequest,
} from "payload";

import type { AgentEvent, Article, User } from "@/payload-types";
import {
  articleRelationID,
  commitMemberPublication,
  getLatestDraftArticle,
  prepareMemberPublication,
} from "@/cms/article-publication";

import {
  agentBodyToLexical,
  agentBodyToMarkdown,
  lexicalToAgentBody,
  UnsupportedAgentContentError,
} from "./content";
import {
  createPublicationConfirmation,
  PublicationConfirmationError,
  publicationConfirmationDigest,
  readPublicationConfirmation,
  type PublicationConfirmationPayload,
} from "./confirmation";
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
  resource: string;
  role: string;
  userId: number;
};

type WriteContext = {
  idempotencyKey: string;
  tool: "article_commit_publication" | "article_create_draft" | "article_save_draft";
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
    resource: auth.resource?.href ?? "",
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

function relationId(value: number | { id: number } | null | undefined) {
  return value && typeof value === "object" ? value.id : value;
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

function publicationSummary(
  article: Article,
  action: PublicationConfirmationPayload["action"],
) {
  return {
    action,
    article: articleSummary(article),
    publicPath: `/${article.locale}/posts/${article.slug}`,
  };
}

type PublicationResult = ReturnType<typeof publicationSummary>;

function storedPublicationFingerprint(fingerprint: string, result: PublicationResult) {
  return `pub1.${fingerprint}.${Buffer.from(JSON.stringify(result), "utf8").toString("base64url")}`;
}

function readStoredPublicationFingerprint(value: string | null | undefined) {
  if (!value?.startsWith("pub1.")) return null;
  const [, fingerprint, encoded, ...rest] = value.split(".");
  if (!fingerprint || !encoded || rest.length) return null;
  try {
    const result = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as PublicationResult;
    if (!result || typeof result !== "object" || !result.article || typeof result.article.id !== "number") return null;
    return { fingerprint, result };
  } catch {
    return null;
  }
}

function errorCode(error: unknown): AgentErrorCode {
  if (error instanceof AgentServiceError) return error.code;
  if (error instanceof UnsupportedAgentContentError) return "UNSUPPORTED_CONTENT";
  if (error instanceof PublicationConfirmationError) {
    return error.reason === "expired" ? "CONFIRMATION_EXPIRED" : "CONFIRMATION_INVALID";
  }
  if (error instanceof APIError) {
    return error.status === 401 ? "UNAUTHENTICATED" : error.status === 403 ? "FORBIDDEN" : "VALIDATION_ERROR";
  }
  if (error instanceof TypeError) return "VALIDATION_ERROR";
  return "INTERNAL_ERROR";
}

function auditedFailureRequestId(requestId: string, error: unknown) {
  return `${requestId}_${errorCode(error)}`;
}

function failure(error: unknown, requestId = createAgentRequestId()) {
  if (error instanceof AgentServiceError) {
    return agentFailure({ code: error.code, message: error.message, retryable: error.code === "TEMPORARY_FAILURE", details: error.details }, { requestId });
  }
  if (error instanceof UnsupportedAgentContentError) {
    return agentFailure({ code: "UNSUPPORTED_CONTENT", message: error.message, retryable: false }, { requestId });
  }
  if (error instanceof PublicationConfirmationError) {
    return agentFailure({
      code: error.reason === "expired" ? "CONFIRMATION_EXPIRED" : "CONFIRMATION_INVALID",
      message: error.message,
      retryable: false,
    }, { requestId });
  }
  if (error instanceof APIError) {
    const code: AgentErrorCode = error.status === 401
      ? "UNAUTHENTICATED"
      : error.status === 403
        ? "FORBIDDEN"
        : "VALIDATION_ERROR";
    return agentFailure({ code, message: error.message, retryable: false }, { requestId });
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
    let connection;
    try {
      connection = await this.payload.findByID({
        collection: "agent-connections",
        id: this.actor.connectionId,
        depth: 0,
        overrideAccess: true,
      });
    } catch {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent connection is no longer active.");
    }
    const connectionPersonId = articleRelationID(connection.person);
    if (
      connection.state !== "active"
      || articleRelationID(connection.user) !== this.actor.userId
      || (connectionPersonId != null && connectionPersonId !== this.actor.personId)
    ) {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent connection is no longer active.");
    }
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

  private async latestArticleRevision(article: Article, req?: PayloadRequest) {
    const latestDraft = await getLatestDraftArticle(this.payload, article.id, article, req);
    return revision(latestDraft);
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
        tools: ["account_context", "capabilities_list", "my_articles_list", "article_get_working_copy", "article_create_draft", "article_save_draft", "article_preview", "article_prepare_publication", "article_commit_publication"],
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
      const currentRevision = await this.latestArticleRevision(article);
      await this.auditAttempt({ objectId: String(article.id), objectType: "article", requestId, result: "success", tool: "article_get_working_copy" });
      return agentSuccess({ ...articleSummary(article), revision: currentRevision, summary: article.summary ?? null, body, markdown: agentBodyToMarkdown(body) }, { requestId, meta: { objectId: String(article.id), revision: currentRevision } });
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

  private async lockMedia(req: PayloadRequest, id: number) {
    const transactionId = await req.transactionID;
    const db = transactionId
      ? (this.payload.db.sessions?.[String(transactionId)]?.db as { execute: (query: unknown) => Promise<{ rows?: { id: number }[] }> } | undefined)
      : undefined;
    if (!db) throw new AgentServiceError("TEMPORARY_FAILURE", "The publication media transaction is unavailable.");
    const result = await db.execute(sql`SELECT id FROM media WHERE id = ${id} FOR UPDATE`);
    if (!result.rows?.[0]) throw new AgentServiceError("VALIDATION_ERROR", "The publication cover image no longer exists.");
  }

  private async lockAgentEvent(req: PayloadRequest, id: number) {
    const transactionId = await req.transactionID;
    const db = transactionId
      ? (this.payload.db.sessions?.[String(transactionId)]?.db as { execute: (query: unknown) => Promise<{ rows?: { id: number }[] }> } | undefined)
      : undefined;
    if (!db) throw new AgentServiceError("TEMPORARY_FAILURE", "The publication confirmation transaction is unavailable.");
    const result = await db.execute(sql`SELECT id FROM agent_events WHERE id = ${id} FOR UPDATE`);
    if (!result.rows?.[0]) throw new AgentServiceError("CONFIRMATION_INVALID", "The publication confirmation is invalid.");
  }

  private async lockActorContext(req: PayloadRequest) {
    const transactionId = await req.transactionID;
    const db = transactionId
      ? (this.payload.db.sessions?.[String(transactionId)]?.db as { execute: (query: unknown) => Promise<{ rows?: Record<string, unknown>[] }> } | undefined)
      : undefined;
    if (!db) throw new AgentServiceError("TEMPORARY_FAILURE", "The publication actor transaction is unavailable.");

    const connection = (await db.execute(sql`
      SELECT state, user_id, person_id, client_id, resource, access_expires_at
      FROM agent_connections
      WHERE id = ${this.actor.connectionId}
      FOR UPDATE
    `)).rows?.[0];
    if (
      !connection
      || connection.state !== "active"
      || Number(connection.user_id) !== this.actor.userId
      || Number(connection.person_id) !== this.actor.personId
      || connection.resource !== this.actor.resource
      || connection.access_expires_at == null
      || !Number.isFinite(new Date(String(connection.access_expires_at)).getTime())
      || new Date(String(connection.access_expires_at)).getTime() <= Date.now()
    ) {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent connection is no longer active.");
    }

    const memberScope = (await db.execute(sql`
      SELECT id
      FROM agent_connections_scopes
      WHERE parent_id = ${this.actor.connectionId} AND value = 'agent:member'
      FOR UPDATE
    `)).rows?.[0];
    if (!memberScope) throw new AgentServiceError("CONNECTION_REVOKED", "This Agent connection no longer has Member access.");

    const client = (await db.execute(sql`
      SELECT disabled, expires_at
      FROM agent_oauth_clients
      WHERE id = ${Number(connection.client_id)}
      FOR UPDATE
    `)).rows?.[0];
    if (
      !client
      || client.disabled === true
      || (client.expires_at != null && new Date(String(client.expires_at)).getTime() <= Date.now())
    ) {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent client is no longer active.");
    }

    const user = (await db.execute(sql`
      SELECT account_status, role
      FROM users
      WHERE id = ${this.actor.userId}
      FOR UPDATE
    `)).rows?.[0];
    if (!user) throw new AgentServiceError("UNAUTHENTICATED", "The Agent account no longer exists.");
    if (user.account_status === "paused") throw new AgentServiceError("ACCOUNT_PAUSED", "This account is paused.");

    const person = (await db.execute(sql`
      SELECT user_id
      FROM people
      WHERE id = ${this.actor.personId}
      FOR UPDATE
    `)).rows?.[0];
    if (!person || Number(person.user_id) !== this.actor.userId) {
      throw new AgentServiceError("NO_PERSON", "This account is not linked to a Person.");
    }
    const lockedUser = await this.payload.findByID({
      collection: "users",
      id: this.actor.userId,
      depth: 0,
      overrideAccess: true,
      req,
    }) as User;
    if (lockedUser.role !== user.role) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The current Agent role could not be verified.");
    }
    req.user = lockedUser;
    return lockedUser;
  }

  private async confirmationEvent(digest: string, req?: PayloadRequest) {
    const result = await this.payload.find({
      collection: "agent-events",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      showHiddenFields: true,
      where: { idempotencyDigest: { equals: digest } },
    });
    return result.docs[0] as AgentEvent | undefined;
  }

  private assertConfirmationActor(payload: PublicationConfirmationPayload) {
    if (
      payload.userId !== this.actor.userId
      || payload.personId !== this.actor.personId
      || payload.connectionId !== this.actor.connectionId
    ) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The publication confirmation belongs to a different connection.");
    }
  }

  private assertConfirmationEvent(event: AgentEvent | undefined, payload: PublicationConfirmationPayload) {
    if (!event
      || event.tool !== "article_prepare_publication"
      || event.objectId !== String(payload.articleId)
      || articleRelationID(event.user) !== payload.userId
      || articleRelationID(event.connection) !== payload.connectionId
    ) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The publication confirmation is invalid.");
    }
    if (event.result !== "pending") {
      throw new AgentServiceError("CONFIRMATION_USED", "The publication confirmation was already used. Prepare the action again.");
    }
    if (event.beforeRevision !== payload.revision) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The publication confirmation revision is invalid.");
    }
  }

  private async reserveWrite(input: { fingerprint: string; idempotencyDigest?: string; requestId: string; tool: AgentToolName }, req: PayloadRequest) {
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
          idempotencyDigest: input.idempotencyDigest ?? input.requestId,
          inputFingerprint: input.fingerprint,
          result: "pending",
          occurredAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw new IdempotencyReservationError(error);
    }
  }

  private async finishWrite(eventId: number | string, input: { afterRevision?: string; beforeRevision?: string; inputFingerprint?: string; objectId?: string; result: "success" | "conflict" }, req: PayloadRequest) {
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

  private async replayedPublication(idempotencyDigest: string, fingerprint: string, user: User) {
    const prior = await this.priorWrite(idempotencyDigest);
    if (!prior) return null;
    const stored = readStoredPublicationFingerprint(prior.inputFingerprint);
    const priorFingerprint = stored?.fingerprint ?? prior.inputFingerprint;
    if (priorFingerprint !== fingerprint) {
      throw new AgentServiceError("IDEMPOTENCY_CONFLICT", "The idempotency key was already used with different input.");
    }
    if (prior.result === "conflict") {
      throw new AgentServiceError("REVISION_CONFLICT", "The article changed after this publication action was prepared.", { latestRevision: prior.beforeRevision });
    }
    if (prior.result !== "success" || !prior.objectId || !prior.afterRevision || !stored) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The previous publication has no readable result.");
    }
    await this.ownedArticle(Number(prior.objectId), user);
    if (stored.result.article.revision !== prior.afterRevision) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The stored publication result is inconsistent.");
    }
    return stored.result;
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
    const denied = error instanceof AgentServiceError && ["ACCOUNT_PAUSED", "CONNECTION_REVOKED", "FORBIDDEN", "NO_PERSON", "NOT_FOUND", "UNAUTHENTICATED"].includes(error.code);
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
          const beforeRevision = await this.latestArticleRevision(article, req);
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

  async preparePublication(input: { id: number; revision: string; targetStatus: "published" | "withdrawn" }) {
    const requestId = `prep_${input.targetStatus}_${randomUUID()}`;
    try {
      requireRevision(input.revision);
      const user = await this.currentUser();
      const article = await this.ownedArticle(input.id, user);
      const currentRevision = await this.latestArticleRevision(article);
      if (input.revision !== currentRevision) {
        throw new AgentServiceError(
          "REVISION_CONFLICT",
          "The article changed after this working copy was loaded.",
          { latestRevision: currentRevision },
        );
      }
      const req = await createLocalReq({ user }, this.payload);
      const prepared = await prepareMemberPublication(article, input.targetStatus, req);
      const expiresAt = Date.now() + (5 * 60 * 1_000);
      const confirmationRef = createPublicationConfirmation({
        action: prepared.action,
        articleId: article.id,
        connectionId: this.actor.connectionId,
        exp: expiresAt,
        jti: randomUUID(),
        personId: this.actor.personId,
        revision: currentRevision,
        targetStatus: input.targetStatus,
        userId: this.actor.userId,
        v: 1,
      });
      const event = await this.payload.create({
        collection: "agent-events",
        overrideAccess: true,
        data: {
          user: this.actor.userId,
          connection: this.actor.connectionId,
          clientFamily: this.actor.clientFamily,
          tool: "article_prepare_publication",
          objectType: "article",
          objectId: String(article.id),
          requestId,
          idempotencyDigest: publicationConfirmationDigest(confirmationRef),
          inputFingerprint: inputFingerprint({
            action: prepared.action,
            articleId: article.id,
            revision: currentRevision,
            targetStatus: input.targetStatus,
          }),
          result: "pending",
          beforeRevision: currentRevision,
          occurredAt: new Date().toISOString(),
        },
      });
      return agentSuccess({
        article: { ...articleSummary(article), revision: currentRevision },
        confirmationRef,
        expiresAt: new Date(expiresAt).toISOString(),
        summary: prepared,
      }, {
        requestId,
        meta: {
          auditId: String(event.id),
          objectId: String(article.id),
          revision: currentRevision,
        },
      });
    } catch (error) {
      const failureRequestId = auditedFailureRequestId(requestId, error);
      await this.auditReadFailure("article_prepare_publication", failureRequestId, error, String(input.id));
      return failure(error, failureRequestId);
    }
  }

  async commitPublication(input: { confirmationRef: string; idempotencyKey: string; revision: string }) {
    let requestId = createAgentRequestId();
    let idempotencyDigest: string | undefined;
    let confirmation: PublicationConfirmationPayload | undefined;
    try {
      requireRevision(input.revision);
      const parsedConfirmation = readPublicationConfirmation(input.confirmationRef, { allowExpired: true });
      confirmation = parsedConfirmation;
      this.assertConfirmationActor(parsedConfirmation);
      idempotencyDigest = idempotentRequestId(this.actor, {
        idempotencyKey: input.idempotencyKey,
        tool: "article_commit_publication",
      });
      requestId = `${idempotencyDigest}_${parsedConfirmation.targetStatus}`;
      if (input.revision !== parsedConfirmation.revision) {
        throw new AgentServiceError("CONFIRMATION_INVALID", "The publication confirmation revision does not match this request.");
      }
      const user = await this.currentUser();
      const fingerprint = inputFingerprint({
        confirmationDigest: publicationConfirmationDigest(input.confirmationRef),
        revision: input.revision,
      });
      const prior = await this.replayedPublication(idempotencyDigest, fingerprint, user);
      if (prior) {
        return agentSuccess(prior, {
          requestId,
          meta: {
            idempotencyKey: input.idempotencyKey,
            objectId: String(prior.article.id),
            readAfterWrite: true,
            revision: prior.article.revision,
          },
        });
      }
      let outcome:
        | { article: Article; auditId: string; kind: "committed" }
        | { kind: "conflict"; revision: string };
      try {
        outcome = await this.withWriteTransaction(user, async (req) => {
          const lockedUser = await this.lockActorContext(req);
          if (parsedConfirmation.exp < Date.now()) {
            throw new PublicationConfirmationError("expired", "The publication confirmation expired. Prepare the action again.");
          }
          const commitEvent = await this.reserveWrite({
            fingerprint,
            idempotencyDigest,
            requestId,
            tool: "article_commit_publication",
          }, req);
          const digest = publicationConfirmationDigest(input.confirmationRef);
          const locatedConfirmation = await this.confirmationEvent(digest, req);
          if (!locatedConfirmation) {
            throw new AgentServiceError("CONFIRMATION_INVALID", "The publication confirmation is invalid.");
          }
          await this.lockAgentEvent(req, Number(locatedConfirmation.id));
          const confirmationEvent = await this.confirmationEvent(digest, req);
          this.assertConfirmationEvent(confirmationEvent, parsedConfirmation);

          await this.lockArticle(req, parsedConfirmation.articleId);
          const article = await this.ownedArticle(parsedConfirmation.articleId, lockedUser, req);
          const latestArticle = await getLatestDraftArticle(this.payload, article.id, article, req);
          const beforeRevision = revision(latestArticle);
          const coverImageId = articleRelationID(latestArticle.coverImage);
          if (typeof coverImageId === "number") await this.lockMedia(req, coverImageId);
          if (parsedConfirmation.exp < Date.now()) {
            throw new PublicationConfirmationError("expired", "The publication confirmation expired. Prepare the action again.");
          }
          if (beforeRevision !== parsedConfirmation.revision) {
            await this.finishWrite(commitEvent.id, {
              beforeRevision,
              objectId: String(article.id),
              result: "conflict",
            }, req);
            await this.finishWrite(confirmationEvent!.id, {
              beforeRevision,
              objectId: String(article.id),
              result: "conflict",
            }, req);
            return { kind: "conflict" as const, revision: beforeRevision };
          }

          const prepared = await prepareMemberPublication(article, parsedConfirmation.targetStatus, req);
          if (prepared.action !== parsedConfirmation.action) {
            throw new AgentServiceError("CONFIRMATION_INVALID", "The prepared publication action is no longer valid.");
          }
          const committed = await commitMemberPublication(article, parsedConfirmation.targetStatus, req);
          const committedVersion = await getLatestDraftArticle(this.payload, committed.id, committed, req);
          const afterRevision = revision(committedVersion);
          const result = publicationSummary(committedVersion, parsedConfirmation.action);
          await this.finishWrite(confirmationEvent!.id, {
            afterRevision,
            beforeRevision,
            objectId: String(committed.id),
            result: "success",
          }, req);
          await this.finishWrite(commitEvent.id, {
            afterRevision,
            beforeRevision,
            inputFingerprint: storedPublicationFingerprint(fingerprint, result),
            objectId: String(committed.id),
            result: "success",
          }, req);
          return {
            article: committedVersion,
            auditId: String(commitEvent.id),
            kind: "committed" as const,
          };
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedPublication(idempotencyDigest, fingerprint, user);
        if (!replay) throw error.original;
        return agentSuccess(replay, {
          requestId,
          meta: {
            idempotencyKey: input.idempotencyKey,
            objectId: String(replay.article.id),
            readAfterWrite: true,
            revision: replay.article.revision,
          },
        });
      }
      if (outcome.kind === "conflict") {
        throw new AgentServiceError(
          "REVISION_CONFLICT",
          "The article changed after this publication action was prepared.",
          { latestRevision: outcome.revision },
        );
      }
      return agentSuccess(publicationSummary(outcome.article, parsedConfirmation.action), {
        requestId,
        meta: {
          ...(outcome.auditId ? { auditId: outcome.auditId } : {}),
          idempotencyKey: input.idempotencyKey,
          objectId: String(outcome.article.id),
          readAfterWrite: true,
          revision: revision(outcome.article),
        },
      });
    } catch (error) {
      if (!(error instanceof AgentServiceError && [
        "IDEMPOTENCY_CONFLICT",
        "REVISION_CONFLICT",
      ].includes(error.code))) {
        const failureRequestId = auditedFailureRequestId(requestId, error);
        await this.auditAttempt({ objectId: confirmation ? String(confirmation.articleId) : undefined, objectType: "article", requestId: failureRequestId, result: "failed", tool: "article_commit_publication" });
        return failure(error, failureRequestId);
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
