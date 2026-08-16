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
  type Where,
  type Payload,
  type PayloadRequest,
} from "payload";

import type { AgentEvent, Article, Media, Person, User, WorkflowEvent } from "@/payload-types";
import { extractYouTubeVideoID } from "@/collections/Articles";
import {
  commitEditorialSiteSelection,
  editorialCurationIssue,
  prepareEditorialSiteSelection,
  type EditorialSiteSelectionAction,
  type EditorialSiteSelectionTarget,
} from "@/cms/article-curation";
import {
  articleRelationID,
  commitMemberPublication,
  getLatestArticleVersionState,
  getLatestDraftArticle,
  prepareMemberPublication,
} from "@/cms/article-publication";
import { createArticleTranslationDraft } from "@/cms/article-translation";
import {
  createEditorialNotificationEvent,
  deliverEditorialNotification,
} from "@/cms/editorial-notifications";
import { assertMediaAllowedForMemberPublication, assertMediaApprovedForPublicUse } from "@/cms/media-policy";
import { uniqueMediaUploadFilename } from "@/cms/media-upload-filename";
import { isValidEmailProfileLink, isValidWebProfileLink } from "@/cms/profile-links";
import { collectRichTextUploadMediaIDs } from "@/cms/rich-text-media";
import { hasEditorialRole, isSuperAdmin } from "@/cms/roles";
import {
  commitProfilePublication,
  prepareProfilePublication,
  type ProfilePublicationAction,
  type ProfilePublicationTarget,
} from "@/cms/profile-publication";

import {
  agentBodyToLexical,
  agentBodyToMarkdown,
  lexicalToAgentBody,
  lexicalToAgentBodyV2,
  UnsupportedAgentContentError,
} from "./content";
import {
  createHomepageScheduleConfirmation,
  createMajorEditNotificationConfirmation,
  createPublicationConfirmation,
  createProfilePublicationConfirmation,
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
  readSiteSelectionConfirmation,
  readPublicationConfirmation,
  siteSelectionConfirmationDigest,
  type HomepageScheduleConfirmationPayload,
  type MajorEditNotificationConfirmationPayload,
  type PublicationConfirmationPayload,
  type ProfilePublicationConfirmationPayload,
  type SiteSelectionConfirmationPayload,
} from "./confirmation";
import {
  AGENT_BODY_V2_VERSION,
  AGENT_BODY_VERSION,
  agentFailure,
  agentSuccess,
  createAgentRequestId,
  requireIdempotencyKey,
  requireRevision,
  type AgentArticleBody,
  type AgentErrorCode,
  type AgentToolName,
} from "./contracts";
import { createArticleRevision, createPersonRevision } from "./revision";

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
  tool: "article_commit_publication" | "article_create_draft" | "article_create_translation_draft" | "article_save_draft" | "article_set_cover" | "editorial_commit_homepage_schedule" | "editorial_commit_major_edit_notification" | "editorial_commit_site_selection" | "editorial_save_site_fields" | "media_upload" | "my_links_save" | "my_profile_commit_publication" | "my_profile_save";
};

export type HomepageScheduleTarget = {
  endsAt: string | null;
  placement: "lead" | "none" | "selected";
  startsAt: string | null;
};

export type AgentProfilePatch = {
  canHelpWith?: string[];
  canHelpWithEs?: string[];
  city?: string | null;
  cityEs?: string | null;
  identity?: string | null;
  identityEs?: string | null;
  introduction?: string | null;
  introductionEs?: string | null;
  languages?: ("en" | "es")[];
  name?: string;
  nameZh?: string | null;
  portraitId?: number | null;
  quote?: string | null;
  quoteEs?: string | null;
  topicIds?: number[];
};

export type AgentProfileLink = NonNullable<Person["links"]>[number];

export type EditorialReferenceKind = "approved_cover" | "assignee" | "geography" | "purpose" | "situation" | "topic";

export type AgentEditorialSitePatch = {
  assignedEditorId?: number | null;
  coverImageId?: number | null;
  editorComments?: Array<{ anchor: string; id?: string; message: string; resolved?: boolean }>;
  format?: Article["format"];
  freshnessDate?: string | null;
  geographyIds?: number[];
  purposeIds?: number[];
  situationIds?: number[];
  sourceNotes?: Array<{ check?: string | null; checkedAt?: string | null; id?: string; label: string; url?: string | null }>;
  topicIds?: number[];
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

function publicEffect(article: Article) {
  return article.publicationStatus === "published"
    ? "immediate_public_update" as const
    : "private_only" as const;
}

function editorialInvariantSnapshot(article: Article) {
  return {
    author: articleRelationID(article.author),
    authorshipType: article.authorshipType,
    body: article.body,
    curationStatus: article.curationStatus,
    editorialMaster: articleRelationID(article.editorialMaster),
    homepageEndsAt: article.homepageEndsAt ?? null,
    homepagePlacement: article.homepagePlacement ?? null,
    homepageStartsAt: article.homepageStartsAt ?? null,
    locale: article.locale,
    owner: articleRelationID(article.owner),
    publicationStatus: article.publicationStatus,
    publishedAt: article.publishedAt ?? null,
    slug: article.slug,
    summary: article.summary ?? null,
    title: article.title,
    translationGroup: article.translationGroup,
    workflowStatus: article.workflowStatus,
    payloadStatus: article._status ?? null,
  };
}

function coverSummary(article: Article) {
  const coverId = articleRelationID(article.coverImage);
  return { ...articleSummary(article), coverMediaId: typeof coverId === "number" ? coverId : null };
}

function mediaSummary(media: Media) {
  return {
    id: media.id,
    alt: media.alt,
    filename: media.filename ?? null,
    mimeType: media.mimeType ?? null,
    filesize: media.filesize ?? null,
    width: media.width ?? null,
    height: media.height ?? null,
    url: media.url ?? null,
    publicUseApproved: Boolean(media.publicUseApprovedAt),
    createdAt: media.createdAt,
  };
}

function memberMediaSummary(media: Pick<Media, "alt" | "id" | "memberUsePublishedAt" | "publicUseApprovedAt" | "updatedAt" | "url">) {
  return {
    id: media.id,
    alt: media.alt,
    url: media.url ?? null,
    status: media.publicUseApprovedAt
      ? "public_approved" as const
      : media.memberUsePublishedAt
        ? "member_published" as const
        : "private" as const,
    updatedAt: media.updatedAt,
  };
}

function profileCompleteness(person: Person) {
  const missing = [
    !person.name.trim() ? "name" : null,
    !person.identity?.trim() ? "identity" : null,
    !person.introduction?.trim() ? "introduction" : null,
    !person.city?.trim() ? "city" : null,
    !(person.languages?.length) ? "languages" : null,
    relationId(person.portrait) == null ? "portrait" : null,
  ].filter((value): value is string => value != null);
  return { complete: missing.length === 0, missing };
}

function profilePath(person: Person) {
  if (!person.slug) return null;
  const locale = person.languages?.[0] === "es" ? "es" : "en";
  return `/${locale}/people/${person.slug}`;
}

function profileSummary(person: Person) {
  const publicPath = profilePath(person);
  return {
    profile: {
      name: person.name,
      nameZh: person.nameZh ?? null,
      portraitId: relationId(person.portrait) ?? null,
      languages: person.languages ?? [],
      topicIds: (person.topics ?? []).map(relationId).filter((value): value is number => typeof value === "number"),
      identity: person.identity ?? null,
      city: person.city ?? null,
      introduction: person.introduction ?? null,
      quote: person.quote ?? null,
      canHelpWith: (person.canHelpWith ?? []).map((row) => row.item),
      identityEs: person.identityEs ?? null,
      cityEs: person.cityEs ?? null,
      introductionEs: person.introductionEs ?? null,
      quoteEs: person.quoteEs ?? null,
      canHelpWithEs: (person.canHelpWithEs ?? []).map((row) => row.item),
    },
    links: (person.links ?? []).map(({ type, label, labelEs, url }) => ({ type, label, labelEs: labelEs ?? null, url })),
    profileStatus: person.profileStatus,
    publicPath,
    previewPath: publicPath ? `${publicPath}?preview=${encodeURIComponent(String(person.id))}` : null,
    completeness: profileCompleteness(person),
    publicEffect: person.profileStatus === "public" ? "immediate_public_update" as const : "private_only" as const,
    updatedAt: person.updatedAt,
    revision: createPersonRevision(person),
  };
}

function profilePublicationSummary(person: Person, action: ProfilePublicationAction) {
  return { action, person: profileSummary(person), publicPath: profilePath(person) };
}

type StoredProfilePublicationResult = {
  action: ProfilePublicationAction;
  profileStatus: "draft" | "public" | "paused";
  publicPath: string | null;
  revision: string;
};

function storedProfilePublicationFingerprint(fingerprint: string, result: StoredProfilePublicationResult) {
  return `profile_pub1.${fingerprint}.${Buffer.from(JSON.stringify(result), "utf8").toString("base64url")}`;
}

function readStoredProfilePublicationFingerprint(value: string | null | undefined) {
  if (!value?.startsWith("profile_pub1.")) return null;
  const [, fingerprint, encoded, ...rest] = value.split(".");
  if (!fingerprint || !encoded || rest.length) return null;
  try {
    return { fingerprint, result: JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as StoredProfilePublicationResult };
  } catch {
    return null;
  }
}

type AgentPreviewWarning = {
  code: "body_media_ownership" | "heading_level_jump" | "missing_cover" | "missing_summary";
  message: string;
  details?: Record<string, unknown>;
};

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

function siteSelectionSummary(article: Article, action: EditorialSiteSelectionAction) {
  return {
    action,
    article: articleSummary(article),
    publicPath: `/${article.locale}/posts/${article.slug}`,
    siteSelected: article.curationStatus === "curated",
  };
}

type SiteSelectionResult = ReturnType<typeof siteSelectionSummary>;

function storedSiteSelectionFingerprint(fingerprint: string, result: SiteSelectionResult) {
  return `cur1.${fingerprint}.${Buffer.from(JSON.stringify(result), "utf8").toString("base64url")}`;
}

function readStoredSiteSelectionFingerprint(value: string | null | undefined) {
  if (!value?.startsWith("cur1.")) return null;
  const [, fingerprint, encoded, ...rest] = value.split(".");
  if (!fingerprint || !encoded || rest.length) return null;
  try {
    const result = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SiteSelectionResult;
    if (!result || typeof result !== "object" || !result.article || typeof result.article.id !== "number") return null;
    return { fingerprint, result };
  } catch {
    return null;
  }
}

function homepageSchedule(article: Article) {
  return {
    placement: article.homepagePlacement ?? "none",
    startsAt: article.homepageStartsAt ?? null,
    endsAt: article.homepageEndsAt ?? null,
  };
}

function homepageScheduleActiveNow(schedule: ReturnType<typeof homepageSchedule>, now = Date.now()) {
  if (schedule.placement === "none" || !schedule.startsAt || !schedule.endsAt) return false;
  return new Date(schedule.startsAt).getTime() <= now && now < new Date(schedule.endsAt).getTime();
}

function homepageScheduleSummary(
  article: Article,
  recovery: ReturnType<typeof homepageSchedule>,
) {
  const schedule = homepageSchedule(article);
  return {
    action: schedule.placement === "none" ? "clear_homepage" as const : "schedule_homepage" as const,
    article: articleSummary(article),
    schedule: { ...schedule, activeNow: homepageScheduleActiveNow(schedule) },
    recovery,
    publicEffect: "immediate_public_update" as const,
    publicPath: `/${article.locale}/posts/${article.slug}`,
  };
}

type HomepageScheduleResult = ReturnType<typeof homepageScheduleSummary>;

function storedHomepageScheduleFingerprint(fingerprint: string, result: HomepageScheduleResult) {
  return `homepage1.${fingerprint}.${Buffer.from(JSON.stringify(result), "utf8").toString("base64url")}`;
}

function readStoredHomepageScheduleFingerprint(value: string | null | undefined) {
  if (!value?.startsWith("homepage1.")) return null;
  const [, fingerprint, encoded, ...rest] = value.split(".");
  if (!fingerprint || !encoded || rest.length) return null;
  try {
    const result = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as HomepageScheduleResult;
    if (!result || typeof result !== "object" || !result.article || typeof result.article.id !== "number") return null;
    return { fingerprint, result };
  } catch {
    return null;
  }
}

type StoredMajorEditNotificationResult = {
  articleId: number;
  eventId: number;
  revision: string;
};

function storedMajorEditNotificationFingerprint(fingerprint: string, result: StoredMajorEditNotificationResult) {
  return `notify1.${fingerprint}.${Buffer.from(JSON.stringify(result), "utf8").toString("base64url")}`;
}

function readStoredMajorEditNotificationFingerprint(value: string | null | undefined) {
  if (!value?.startsWith("notify1.")) return null;
  const [, fingerprint, encoded, ...rest] = value.split(".");
  if (!fingerprint || !encoded || rest.length) return null;
  try {
    const result = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as StoredMajorEditNotificationResult;
    if (!Number.isInteger(result.articleId) || !Number.isInteger(result.eventId) || typeof result.revision !== "string") return null;
    return { fingerprint, result };
  } catch {
    return null;
  }
}

function majorEditNotificationKey(confirmationRef: string) {
  return `agent_major_${createHash("sha256").update(majorEditNotificationConfirmationDigest(confirmationRef)).digest("base64url")}`;
}

function majorEditNotificationSummary(event: WorkflowEvent) {
  const status = event.notificationStatus ?? "not_required";
  return {
    eventId: Number(event.id),
    notificationKind: "major_edit" as const,
    status,
    attempts: event.notificationAttempts ?? 0,
    retry: status === "failed" || status === "pending" ? "repeat_same_commit" as const : null,
  };
}

function homepageProtectedInvariantSnapshot(article: Article) {
  return Object.fromEntries(Object.entries(editorialInvariantSnapshot(article)).filter(([key]) =>
    key !== "homepageEndsAt" && key !== "homepagePlacement" && key !== "homepageStartsAt"));
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

const MAX_AGENT_UPLOAD_BYTES = 10 * 1024 * 1024;

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

function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(new Date(`${value}T00:00:00.000Z`).getTime());
}

function isISODateTime(value: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(new Date(value).getTime());
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
    const accessExpiresAt = connection.accessExpiresAt == null
      ? Number.NaN
      : new Date(connection.accessExpiresAt).getTime();
    if (
      connection.state !== "active"
      || articleRelationID(connection.user) !== this.actor.userId
      || connectionPersonId !== this.actor.personId
      || connection.resource !== this.actor.resource
      || !connection.scopes.includes("agent:member")
      || !Number.isFinite(accessExpiresAt)
      || accessExpiresAt <= Date.now()
    ) {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent connection is no longer active.");
    }
    const clientId = articleRelationID(connection.client);
    if (typeof clientId !== "number") {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent client is no longer active.");
    }
    let client;
    try {
      client = await this.payload.findByID({ collection: "agent-oauth-clients", id: clientId, depth: 0, overrideAccess: true });
    } catch {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent client is no longer active.");
    }
    const clientExpiresAt = client.expiresAt == null ? null : new Date(client.expiresAt).getTime();
    if (client.disabled || (clientExpiresAt != null && (!Number.isFinite(clientExpiresAt) || clientExpiresAt <= Date.now()))) {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent client is no longer active.");
    }
    const user = await this.payload.findByID({ collection: "users", id: this.actor.userId, depth: 0, overrideAccess: true });
    if (user.accountStatus === "paused") throw new AgentServiceError("ACCOUNT_PAUSED", "This account is paused.");
    const people = await this.payload.find({ collection: "people", depth: 0, limit: 1, overrideAccess: true, pagination: false, where: { and: [{ id: { equals: this.actor.personId } }, { user: { equals: user.id } }] } });
    if (!people.docs[0]) throw new AgentServiceError("NO_PERSON", "This account is not linked to a Person.");
    return user as User;
  }

  async currentRole() {
    return (await this.currentUser()).role;
  }

  private async currentPerson(user: User, req?: PayloadRequest) {
    const localReq = req ?? await createLocalReq({ user }, this.payload);
    let person: Person;
    try {
      person = await this.payload.findByID({
        collection: "people",
        depth: 0,
        id: this.actor.personId,
        overrideAccess: false,
        req: localReq,
        user,
      }) as Person;
    } catch {
      throw new AgentServiceError("NO_PERSON", "This account is not linked to a Person.");
    }
    if (String(relationId(person.user)) !== String(user.id)) {
      throw new AgentServiceError("NO_PERSON", "This account is not linked to a Person.");
    }
    return person;
  }

  private async currentSuperAdmin() {
    const user = await this.currentUser();
    if (!isSuperAdmin(user)) throw new AgentServiceError("FORBIDDEN", "Super Admin access is required.");

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
    const accessExpiresAt = connection.accessExpiresAt == null
      ? Number.NaN
      : new Date(connection.accessExpiresAt).getTime();
    if (
      connection.state !== "active"
      || articleRelationID(connection.user) !== this.actor.userId
      || articleRelationID(connection.person) !== this.actor.personId
      || connection.resource !== this.actor.resource
      || !connection.scopes.includes("agent:member")
      || !Number.isFinite(accessExpiresAt)
      || accessExpiresAt <= Date.now()
    ) {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent connection is no longer active.");
    }

    const clientId = articleRelationID(connection.client);
    if (typeof clientId !== "number") {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent client is no longer active.");
    }
    let client;
    try {
      client = await this.payload.findByID({
        collection: "agent-oauth-clients",
        id: clientId,
        depth: 0,
        overrideAccess: true,
      });
    } catch {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent client is no longer active.");
    }
    const clientExpiresAt = client.expiresAt == null ? null : new Date(client.expiresAt).getTime();
    if (client.disabled || (clientExpiresAt != null && (!Number.isFinite(clientExpiresAt) || clientExpiresAt <= Date.now()))) {
      throw new AgentServiceError("CONNECTION_REVOKED", "This Agent client is no longer active.");
    }
    return user;
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

  private async mediaPolicyReq(user: User, req?: PayloadRequest) {
    if (req) return req;
    return createLocalReq({ user }, this.payload);
  }

  /*
   * INFRA-AGENT-MEDIA-001: same ownership rule as the web write path
   * (BODY-MEDIA-002). The Articles beforeValidate hook re-checks on the
   * real write; this pre-check exists so the Agent surface rejects
   * another member's unapproved media with an exact error before any
   * write is attempted.
   */
  private async assertMediaUsableByMember(mediaId: number | string, label: string, user: User, req?: PayloadRequest) {
    const policyReq = await this.mediaPolicyReq(user, req);
    try {
      await assertMediaAllowedForMemberPublication(mediaId, policyReq, label);
    } catch (error) {
      if (error instanceof APIError && error.status === 403) {
        throw new AgentServiceError("FORBIDDEN", `${label} must be media uploaded by the current member or media approved for public use.`, { mediaId });
      }
      if (error instanceof APIError && error.status !== 400) {
        throw new AgentServiceError("NOT_FOUND", `${label} media was not found.`, { mediaId });
      }
      throw error;
    }
  }

  private async assertWritableBody(body: AgentArticleBody, user: User) {
    if (body.version !== AGENT_BODY_V2_VERSION) return;
    for (const block of body.blocks) {
      if (block.type === "youtube" && !extractYouTubeVideoID(block.url)) {
        throw new AgentServiceError("VALIDATION_ERROR", "Only YouTube video links (youtube.com / youtu.be) are allowed in the article body.");
      }
    }
    for (const block of body.blocks) {
      if (block.type === "image") {
        await this.assertMediaUsableByMember(block.mediaId, "Body image", user);
      }
    }
  }

  private async publicationArticle(id: number, user: User, req?: PayloadRequest) {
    let article: Article;
    try {
      article = await this.payload.findByID({ collection: "articles", id, depth: 0, draft: true, overrideAccess: false, req, user });
    } catch {
      throw new AgentServiceError("NOT_FOUND", "Article not found.");
    }
    const ownsMemberArticle = article.authorshipType !== "site" && String(relationId(article.owner)) === String(user.id);
    const canPublishSiteArticle = article.authorshipType === "site" && isSuperAdmin(user);
    if (!ownsMemberArticle && !canPublishSiteArticle) {
      throw new AgentServiceError("FORBIDDEN", "Only the owner or a Super Admin may publish this article.");
    }
    return article;
  }

  private async editorialArticle(id: number, user: User, req?: PayloadRequest) {
    if (!hasEditorialRole(user)) {
      throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
    }
    try {
      return await this.payload.findByID({
        collection: "articles",
        id,
        depth: 0,
        draft: true,
        overrideAccess: false,
        req,
        user,
      }) as Article;
    } catch {
      throw new AgentServiceError("NOT_FOUND", "Article not found.");
    }
  }

  private async homepageScheduleState(id: number, user: User, req?: PayloadRequest) {
    await this.editorialArticle(id, user, req);
    let live: Article;
    try {
      live = await this.payload.findByID({
        collection: "articles",
        id,
        depth: 0,
        draft: false,
        overrideAccess: false,
        req,
        user,
      }) as Article;
    } catch {
      throw new AgentServiceError("NOT_FOUND", "Article not found.");
    }
    const latestState = await getLatestArticleVersionState(this.payload, live.id, live, req);
    const latest = latestState.article;
    if (live.publicationStatus !== "published" || live.curationStatus !== "curated" || live._status !== "published") {
      throw new AgentServiceError("VALIDATION_ERROR", "Homepage scheduling requires a live, published and site-selected Article.");
    }
    if (latestState.autosave || latest._status !== "published") {
      throw new AgentServiceError("VALIDATION_ERROR", "Homepage scheduling is blocked while the Article has an unpublished pending draft.");
    }
    return { latest, live };
  }

  private homepageScheduleTarget(target: HomepageScheduleTarget) {
    if (target.placement === "none") {
      if (target.startsAt !== null || target.endsAt !== null) {
        throw new AgentServiceError("VALIDATION_ERROR", "Clearing a homepage schedule requires null start and end values.");
      }
      return { placement: "none" as const, startsAt: null, endsAt: null };
    }
    if ((target.placement !== "lead" && target.placement !== "selected")
      || typeof target.startsAt !== "string" || typeof target.endsAt !== "string"
      || !isISODateTime(target.startsAt) || !isISODateTime(target.endsAt)) {
      throw new AgentServiceError("VALIDATION_ERROR", "Homepage lead and selected schedules require complete RFC 3339 start and end times.");
    }
    if (new Date(target.endsAt).getTime() <= new Date(target.startsAt).getTime()) {
      throw new AgentServiceError("VALIDATION_ERROR", "Homepage scheduling must end after it starts.");
    }
    return { placement: target.placement, startsAt: target.startsAt, endsAt: target.endsAt };
  }

  private async majorEditRecipient(article: Article, req?: PayloadRequest) {
    if (article.authorshipType !== "member") throw new AgentServiceError("VALIDATION_ERROR", "Only a Member-authored Article has an author account to notify.");
    const ownerId = articleRelationID(article.owner);
    if (typeof ownerId !== "number") throw new AgentServiceError("VALIDATION_ERROR", "The Article owner is unavailable for notification.");
    let owner: User;
    try {
      owner = await this.payload.findByID({ collection: "users", id: ownerId, depth: 0, overrideAccess: true, req }) as User;
    } catch {
      throw new AgentServiceError("VALIDATION_ERROR", "The Article owner is unavailable for notification.");
    }
    if (owner.accountStatus !== "active" || !owner.email?.trim()) {
      throw new AgentServiceError("VALIDATION_ERROR", "The Article owner is unavailable for notification.");
    }
    return owner;
  }

  private async latestArticleRevision(article: Article, req?: PayloadRequest) {
    const latestDraft = await getLatestDraftArticle(this.payload, article.id, article, req);
    return revision(latestDraft);
  }

  async accountContext() {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      const person = await this.currentPerson(user);
      await this.auditAttempt({ objectType: "account", requestId, result: "success", tool: "account_context" });
      return agentSuccess({
        userId: user.id,
        personId: person.id,
        role: user.role,
        accountStatus: user.accountStatus,
        profileStatus: person.profileStatus,
        profileCompleteness: profileCompleteness(person),
        profilePublicPath: profilePath(person),
      }, { requestId });
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
      const tools: AgentToolName[] = ["account_context", "capabilities_list", "my_profile_get", "my_profile_save", "my_links_save", "my_profile_prepare_publication", "my_profile_commit_publication", "my_articles_list", "my_media_list", "article_get_working_copy", "article_create_draft", "article_create_translation_draft", "article_save_draft", "media_upload", "article_set_cover", "article_preview", "article_prepare_publication", "article_commit_publication"];
      if (hasEditorialRole(user)) {
        tools.push("editorial_attention_list", "editorial_reference_options", "editorial_article_get", "editorial_save_site_fields", "editorial_prepare_site_selection", "editorial_commit_site_selection", "editorial_prepare_homepage_schedule", "editorial_commit_homepage_schedule", "editorial_prepare_major_edit_notification", "editorial_commit_major_edit_notification");
      }
      if (isSuperAdmin(user)) tools.push("editorial_release_site_article_batch", "admin_recent_activity");
      return agentSuccess({
        tools,
        role: user.role,
      }, { requestId });
    } catch (error) {
      await this.auditReadFailure("capabilities_list", requestId, error);
      return failure(error, requestId);
    }
  }

  async myProfileGet() {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      const person = await this.currentPerson(user);
      const result = profileSummary(person);
      await this.auditAttempt({ objectId: String(person.id), objectType: "account", requestId, result: "success", tool: "my_profile_get" });
      return agentSuccess(result, { requestId, meta: { objectId: String(person.id), revision: result.revision } });
    } catch (error) {
      await this.auditReadFailure("my_profile_get", requestId, error);
      return failure(error, requestId);
    }
  }

  async adminRecentActivity() {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentSuperAdmin();
      const req = await createLocalReq({ user }, this.payload);
      const asOf = new Date().toISOString();
      const result = await this.payload.find({
        collection: "workflow-events",
        depth: 0,
        limit: 20,
        overrideAccess: false,
        pagination: false,
        req,
        sort: "-occurredAt",
        user,
        where: { occurredAt: { less_than_equal: asOf } },
      });
      const events = result.docs as WorkflowEvent[];
      const articleIds = [...new Set(events.map((event) => articleRelationID(event.article)).filter((id): id is number => typeof id === "number"))];
      const actorIds = [...new Set(events.map((event) => articleRelationID(event.actor)).filter((id): id is number => typeof id === "number"))];
      const [articles, actors] = await Promise.all([
        articleIds.length
          ? this.payload.find({ collection: "articles", depth: 0, draft: true, limit: articleIds.length, overrideAccess: false, pagination: false, req, user, where: { id: { in: articleIds } } })
          : Promise.resolve({ docs: [] as Article[] }),
        actorIds.length
          ? this.payload.find({ collection: "users", depth: 0, limit: actorIds.length, overrideAccess: false, pagination: false, req, user, where: { id: { in: actorIds } } })
          : Promise.resolve({ docs: [] as User[] }),
      ]);
      const articleById = new Map(articles.docs.map((article) => [String(article.id), article]));
      const actorById = new Map(actors.docs.map((actor) => [String(actor.id), actor]));
      const items = events.map((event) => {
        const articleId = articleRelationID(event.article);
        const article = articleId == null ? null : articleById.get(String(articleId));
        const actorId = articleRelationID(event.actor);
        const actor = actorId == null ? null : actorById.get(String(actorId));
        return {
          id: event.id,
          article: articleId == null ? null : {
            id: articleId,
            title: article?.title ?? null,
            locale: article?.locale ?? null,
            publicPath: article ? `/${article.locale}/posts/${article.slug}` : null,
          },
          actor: actorId == null ? null : { id: actorId, displayName: actor?.displayName ?? null },
          axis: event.axis ?? null,
          fromStatus: event.fromStatus ?? null,
          toStatus: event.toStatus,
          notificationKind: event.notificationKind ?? null,
          notificationStatus: event.notificationStatus ?? null,
          occurredAt: event.occurredAt,
        };
      });
      await this.auditAttempt({ objectType: "account", requestId, result: "success", tool: "admin_recent_activity" });
      return agentSuccess({ asOf, count: items.length, items }, { requestId });
    } catch (error) {
      await this.auditReadFailure("admin_recent_activity", requestId, error);
      return failure(error, requestId);
    }
  }

  async releaseSiteArticleBatch(input: { ids: number[]; approval: string; idempotencyKey: string }) {
    const requestId = createAgentRequestId();
    try {
      if (input.approval !== "PUBLISH_AND_CURATE_SITE_ARTICLES") {
        throw new AgentServiceError("VALIDATION_ERROR", "The exact batch publication approval is required.");
      }
      const batchKey = requireIdempotencyKey(input.idempotencyKey);
      const ids = [...new Set(input.ids)];
      if (!ids.length || ids.length !== input.ids.length || ids.length > 20 || ids.some((id) => !Number.isInteger(id) || id <= 0)) {
        throw new AgentServiceError("VALIDATION_ERROR", "Provide 1-20 unique positive Article IDs.");
      }
      const user = await this.currentSuperAdmin();
      const released: ReturnType<typeof articleSummary>[] = [];
      for (const id of ids) {
        let article = await this.editorialArticle(id, user);
        let latest = await getLatestDraftArticle(this.payload, article.id, article);
        if (latest.authorshipType !== "site") {
          throw new AgentServiceError("FORBIDDEN", "Batch release only accepts site-authored Articles.", { articleId: id });
        }
        if (latest.publicationStatus !== "published") {
          const prepared = await this.preparePublication({ id, revision: revision(latest), targetStatus: "published" });
          if (!prepared.ok || !prepared.data) throw new AgentServiceError(prepared.error?.code ?? "INTERNAL_ERROR", prepared.error?.message ?? "Publication preparation failed.", { articleId: id });
          const committed = await this.commitPublication({
            confirmationRef: prepared.data.confirmationRef,
            idempotencyKey: `${batchKey}:publish:${id}`,
            revision: revision(latest),
          });
          if (!committed.ok) throw new AgentServiceError(committed.error?.code ?? "INTERNAL_ERROR", committed.error?.message ?? "Publication commit failed.", { articleId: id });
        }
        article = await this.editorialArticle(id, user);
        latest = await getLatestDraftArticle(this.payload, article.id, article);
        if (latest.curationStatus !== "curated") {
          const prepared = await this.prepareSiteSelection({ id, revision: revision(latest), targetStatus: "curated" });
          if (!prepared.ok || !prepared.data) throw new AgentServiceError(prepared.error?.code ?? "INTERNAL_ERROR", prepared.error?.message ?? "Site selection preparation failed.", { articleId: id });
          const committed = await this.commitSiteSelection({
            confirmationRef: prepared.data.confirmationRef,
            idempotencyKey: `${batchKey}:curate:${id}`,
            revision: revision(latest),
          });
          if (!committed.ok) throw new AgentServiceError(committed.error?.code ?? "INTERNAL_ERROR", committed.error?.message ?? "Site selection commit failed.", { articleId: id });
        }
        article = await this.editorialArticle(id, user);
        latest = await getLatestDraftArticle(this.payload, article.id, article);
        if (latest.publicationStatus !== "published" || latest.curationStatus !== "curated") {
          throw new AgentServiceError("INTERNAL_ERROR", "Article release readback did not match the requested state.", { articleId: id });
        }
        released.push(articleSummary(latest));
      }
      return agentSuccess({ count: released.length, articles: released }, { requestId });
    } catch (error) {
      return failure(error, requestId);
    }
  }

  async myArticles(input: { locale?: "en" | "es"; limit?: number; page?: number; publicationStatus?: "draft" | "published" | "withdrawn" } = {}) {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      const page = input.page ?? 1;
      const limit = input.limit ?? 20;
      const conditions: Where[] = [{ owner: { equals: user.id } }];
      if (input.locale) conditions.push({ locale: { equals: input.locale } });
      if (input.publicationStatus) conditions.push({ publicationStatus: { equals: input.publicationStatus } });
      const req = await createLocalReq({ user }, this.payload);
      // Payload's draft reader rewrites access filters against `version.*`,
      // where owner is not queryable. The explicit current-owner predicate is
      // therefore the security boundary for this self-only latest-draft list.
      const result = await this.payload.find({ collection: "articles", depth: 0, draft: true, limit, page, overrideAccess: true, req, user, sort: "-updatedAt", where: { and: conditions } });
      const groups = [...new Set(result.docs.map((article) => article.translationGroup))];
      const translations = groups.length ? await this.payload.find({
        collection: "articles",
        depth: 0,
        draft: true,
        limit: Math.max(groups.length * 2, 1),
        overrideAccess: true,
        pagination: false,
        req,
        user,
        where: { and: [{ owner: { equals: user.id } }, { translationGroup: { in: groups } }] },
      }) : { docs: [] as Article[] };
      const pairByGroup = new Map<string, { enId: number | null; esId: number | null }>();
      for (const article of translations.docs) {
        const pair = pairByGroup.get(article.translationGroup) ?? { enId: null, esId: null };
        if (article.locale === "en") pair.enId = article.id;
        else pair.esId = article.id;
        pairByGroup.set(article.translationGroup, pair);
      }
      await this.auditAttempt({ objectType: "article", requestId, result: "success", tool: "my_articles_list" });
      return agentSuccess({
        articles: result.docs.map((article) => {
          const pair = pairByGroup.get(article.translationGroup) ?? { enId: null, esId: null };
          return { ...articleSummary(article), translation: { ...pair, paired: pair.enId != null && pair.esId != null } };
        }),
        page: result.page ?? page,
        limit,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      }, { requestId });
    } catch (error) {
      await this.auditReadFailure("my_articles_list", requestId, error);
      return failure(error, requestId);
    }
  }

  async myMedia(input: { limit?: number; page?: number } = {}) {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      const page = input.page ?? 1;
      const limit = input.limit ?? 20;
      const req = await createLocalReq({ user }, this.payload);
      const result = await this.payload.find({
        collection: "media",
        depth: 0,
        limit,
        page,
        overrideAccess: false,
        req,
        select: {
          alt: true,
          memberUsePublishedAt: true,
          publicUseApprovedAt: true,
          updatedAt: true,
          url: true,
        },
        sort: "-updatedAt",
        user,
        where: { uploadedBy: { equals: user.id } },
      });
      await this.auditAttempt({ objectType: "account", requestId, result: "success", tool: "my_media_list" });
      return agentSuccess({
        media: result.docs.map(memberMediaSummary),
        page: result.page ?? page,
        limit,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      }, { requestId });
    } catch (error) {
      await this.auditReadFailure("my_media_list", requestId, error);
      return failure(error, requestId);
    }
  }

  private async bodyMediaAltById(article: Article, user: User) {
    const altById = new Map<string, string>();
    const mediaIds = collectRichTextUploadMediaIDs(article.body);
    if (!mediaIds.length) return altById;
    const req = await createLocalReq({ user }, this.payload);
    const media = await this.payload.find({
      collection: "media",
      depth: 0,
      limit: mediaIds.length,
      overrideAccess: false,
      pagination: false,
      req,
      user,
      where: { id: { in: mediaIds } },
    });
    for (const doc of media.docs) altById.set(String(doc.id), doc.alt);
    return altById;
  }

  async workingCopy(id: number, options: { bodyVersion?: typeof AGENT_BODY_VERSION | typeof AGENT_BODY_V2_VERSION } = {}) {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      const article = await this.ownedArticle(id, user);
      // The default stays AgentArticleBodyV1, so existing V1 clients keep
      // their exact behaviour, including the explicit UNSUPPORTED_CONTENT
      // failure for bodies that contain media blocks.
      let body: AgentArticleBody;
      if (options.bodyVersion === AGENT_BODY_V2_VERSION) {
        const altById = await this.bodyMediaAltById(article, user);
        body = lexicalToAgentBodyV2(article.body.root, {
          mediaAlt: (mediaId) => altById.get(String(mediaId)) ?? null,
        });
      } else {
        body = lexicalToAgentBody(article.body.root);
      }
      const currentRevision = await this.latestArticleRevision(article);
      await this.auditAttempt({ objectId: String(article.id), objectType: "article", requestId, result: "success", tool: "article_get_working_copy" });
      return agentSuccess({ ...articleSummary(article), revision: currentRevision, summary: article.summary ?? null, body, markdown: agentBodyToMarkdown(body) }, { requestId, meta: { objectId: String(article.id), revision: currentRevision } });
    } catch (error) {
      await this.auditReadFailure("article_get_working_copy", requestId, error, String(id));
      return failure(error, requestId);
    }
  }

  private async editorialSiteFields(article: Article, user: User, req?: PayloadRequest) {
    const localReq = req ?? await createLocalReq({ user }, this.payload);
    const authorId = articleRelationID(article.author);
    const author = typeof authorId === "number"
      ? await this.payload.findByID({ collection: "people", id: authorId, depth: 0, overrideAccess: false, req: localReq, user })
      : null;
    const taxonomyIds = [article.purposes, article.topics, article.geographies, article.situations]
      .flatMap((values) => (values ?? []).map(articleRelationID))
      .filter((value): value is number => typeof value === "number");
    const taxonomies = taxonomyIds.length
      ? await this.payload.find({ collection: "taxonomies", depth: 0, limit: taxonomyIds.length, overrideAccess: false, pagination: false, req: localReq, user, where: { id: { in: taxonomyIds } } })
      : { docs: [] };
    const taxonomyById = new Map(taxonomies.docs.map((taxonomy) => [String(taxonomy.id), taxonomy]));
    const classifications = (values: Article["purposes"]) => (values ?? []).flatMap((value) => {
      const id = articleRelationID(value);
      const taxonomy = id == null ? null : taxonomyById.get(String(id));
      return taxonomy ? [{ id: taxonomy.id, name: taxonomy.name }] : [];
    });

    const referencedUserIds = [article.assignedEditor, ...(article.editorComments ?? []).map((comment) => comment.createdBy)]
      .map(articleRelationID)
      .filter((value): value is number => typeof value === "number");
    const userLabels = new Map<string, string>();
    userLabels.set(String(user.id), user.displayName);
    if (isSuperAdmin(user) && referencedUserIds.length) {
      const users = await this.payload.find({
        collection: "users",
        depth: 0,
        limit: referencedUserIds.length,
        overrideAccess: false,
        pagination: false,
        req: localReq,
        select: { displayName: true },
        user,
        where: { id: { in: [...new Set(referencedUserIds)] } },
      });
      for (const item of users.docs) userLabels.set(String(item.id), item.displayName);
    }

    const coverId = articleRelationID(article.coverImage);
    const cover = typeof coverId === "number"
      ? await this.payload.findByID({ collection: "media", id: coverId, depth: 0, overrideAccess: false, req: localReq, user })
      : null;
    const assignedEditorId = articleRelationID(article.assignedEditor);
    return {
      author: author ? { id: author.id, name: author.name, slug: author.slug } : null,
      assignedEditor: typeof assignedEditorId === "number"
        ? { id: assignedEditorId, label: userLabels.get(String(assignedEditorId)) ?? null }
        : null,
      format: article.format ?? null,
      classifications: {
        purposes: classifications(article.purposes),
        topics: classifications(article.topics),
        geographies: classifications(article.geographies),
        situations: classifications(article.situations),
      },
      sourceNotes: (article.sourceNotes ?? []).map(({ check, checkedAt, id, label, url }) => ({
        id: id ?? null,
        label,
        url: url ?? null,
        checkedAt: checkedAt ?? null,
        check: check ?? null,
      })),
      freshnessDate: article.freshnessDate ?? null,
      editorComments: (article.editorComments ?? []).map(({ anchor, createdBy, id, message, resolved }) => {
        const createdById = articleRelationID(createdBy);
        return {
          id: id ?? null,
          anchor,
          message,
          resolved: Boolean(resolved),
          createdBy: typeof createdById === "number"
            ? { id: createdById, label: userLabels.get(String(createdById)) ?? null }
            : null,
        };
      }),
      cover: cover ? { id: cover.id, alt: cover.alt, approved: Boolean(cover.publicUseApprovedAt) } : null,
      publicEffect: publicEffect(article),
    };
  }

  async editorialAttentionList(input: { assignee?: "all" | "mine" | "unassigned"; limit?: number; locale?: "en" | "es"; page?: number } = {}) {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      if (!hasEditorialRole(user)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
      const page = input.page ?? 1;
      const limit = input.limit ?? 20;
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new AgentServiceError("VALIDATION_ERROR", "Pagination must use a positive page and a limit from 1 to 50.");
      }
      if (input.locale !== undefined && input.locale !== "en" && input.locale !== "es") throw new AgentServiceError("VALIDATION_ERROR", "Locale must be en or es.");
      if (input.assignee !== undefined && !["all", "mine", "unassigned"].includes(input.assignee)) throw new AgentServiceError("VALIDATION_ERROR", "Assignee filter must be all, mine or unassigned.");
      const req = await createLocalReq({ user }, this.payload);
      const where: Where = {
        and: [
          { publicationStatus: { equals: "published" } },
          { or: [{ curationStatus: { equals: "not_selected" } }, { curationStatus: { equals: "needs_recheck" } }] },
          ...(input.locale ? [{ locale: { equals: input.locale } }] : []),
          ...(input.assignee === "mine" ? [{ assignedEditor: { equals: user.id } }] : []),
          ...(input.assignee === "unassigned" ? [{ assignedEditor: { exists: false } }] : []),
        ],
      };
      const result = await this.payload.find({ collection: "articles", depth: 0, limit, page, overrideAccess: false, req, sort: "-updatedAt", user, where });
      const articles = await Promise.all(result.docs.map((article) => getLatestDraftArticle(this.payload, article.id, article, req)));
      const authorIds = articles.map((article) => articleRelationID(article.author)).filter((value): value is number => typeof value === "number");
      const authors = authorIds.length ? await this.payload.find({ collection: "people", depth: 0, limit: authorIds.length, overrideAccess: false, pagination: false, req, select: { name: true }, user, where: { id: { in: [...new Set(authorIds)] } } }) : { docs: [] };
      const authorNames = new Map(authors.docs.map((author) => [String(author.id), author.name]));
      const assignedIds = articles.map((article) => articleRelationID(article.assignedEditor)).filter((value): value is number => typeof value === "number");
      const assigneeNames = new Map<string, string>([[String(user.id), user.displayName]]);
      if (isSuperAdmin(user) && assignedIds.length) {
        const users = await this.payload.find({ collection: "users", depth: 0, limit: assignedIds.length, overrideAccess: false, pagination: false, req, select: { displayName: true }, user, where: { id: { in: [...new Set(assignedIds)] } } });
        for (const item of users.docs) assigneeNames.set(String(item.id), item.displayName);
      }
      const eventPages = await Promise.all(articles.map((article) => this.payload.find({ collection: "workflow-events", depth: 0, limit: 1, overrideAccess: false, pagination: false, req, sort: "-occurredAt", user, where: { article: { equals: article.id } } })));
      const latestEvents = new Map<string, WorkflowEvent>();
      for (const event of eventPages.flatMap((eventPage) => eventPage.docs)) {
        const articleId = articleRelationID(event.article);
        if (articleId != null && !latestEvents.has(String(articleId))) latestEvents.set(String(articleId), event);
      }
      await this.auditAttempt({ objectType: "article", requestId, result: "success", tool: "editorial_attention_list" });
      return agentSuccess({
        articles: articles.map((article) => {
          const authorId = articleRelationID(article.author);
          const assignedEditorId = articleRelationID(article.assignedEditor);
          const event = latestEvents.get(String(article.id));
          return {
            id: article.id,
            title: article.title,
            author: typeof authorId === "number" ? { id: authorId, name: authorNames.get(String(authorId)) ?? null } : null,
            locale: article.locale,
            assignedEditor: typeof assignedEditorId === "number" ? { id: assignedEditorId, label: assigneeNames.get(String(assignedEditorId)) ?? null } : null,
            curationStatus: article.curationStatus,
            latestWorkflowEvent: event ? { axis: event.axis ?? null, fromStatus: event.fromStatus ?? null, toStatus: event.toStatus, occurredAt: event.occurredAt } : null,
            updatedAt: article.updatedAt,
            revision: revision(article),
          };
        }),
        page: result.page ?? page,
        limit,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
      }, { requestId });
    } catch (error) {
      await this.auditReadFailure("editorial_attention_list", requestId, error);
      return failure(error, requestId);
    }
  }

  async editorialReferenceOptions(input: { kind: EditorialReferenceKind; limit?: number; page?: number; query?: string }) {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      if (!hasEditorialRole(user)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
      const allowedKinds: EditorialReferenceKind[] = ["assignee", "purpose", "topic", "geography", "situation", "approved_cover"];
      if (!allowedKinds.includes(input.kind)) throw new AgentServiceError("VALIDATION_ERROR", "Unknown editorial reference kind.");
      const page = input.page ?? 1;
      const limit = input.limit ?? 20;
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
        throw new AgentServiceError("VALIDATION_ERROR", "Pagination must use a positive page and a limit from 1 to 50.");
      }
      const query = input.query?.trim() ?? "";
      if (query.length > 200) throw new AgentServiceError("VALIDATION_ERROR", "Reference search must be at most 200 characters.");
      const req = await createLocalReq({ user }, this.payload);
      if (input.kind === "assignee" && !isSuperAdmin(user)) {
        const matches = !query || user.displayName.toLocaleLowerCase().includes(query.toLocaleLowerCase());
        const all = matches ? [{ id: user.id, label: user.displayName, kind: input.kind }] : [];
        const start = (page - 1) * limit;
        await this.auditAttempt({ objectId: `reference:${input.kind}`, objectType: "account", requestId, result: "success", tool: "editorial_reference_options" });
        return agentSuccess({ options: all.slice(start, start + limit), page, limit, totalDocs: all.length, totalPages: Math.ceil(all.length / limit) }, { requestId });
      }
      if (input.kind === "assignee") {
        const result = await this.payload.find({
          collection: "users", depth: 0, limit, page, overrideAccess: false, req,
          select: { displayName: true }, sort: "displayName", user,
          where: { and: [
            { accountStatus: { equals: "active" } },
            { role: { in: ["editor", "super_admin"] } },
            ...(query ? [{ displayName: { contains: query } }] : []),
          ] },
        });
        await this.auditAttempt({ objectId: `reference:${input.kind}`, objectType: "account", requestId, result: "success", tool: "editorial_reference_options" });
        return agentSuccess({ options: result.docs.map((item) => ({ id: item.id, label: item.displayName, kind: input.kind })), page: result.page ?? page, limit, totalDocs: result.totalDocs, totalPages: result.totalPages }, { requestId });
      }
      if (input.kind === "approved_cover") {
        const result = await this.payload.find({
          collection: "media", depth: 0, limit, page, overrideAccess: false, req,
          select: { alt: true }, sort: "alt", user,
          where: { and: [
            { publicUseApprovedAt: { exists: true } },
            ...(query ? [{ alt: { contains: query } }] : []),
          ] },
        });
        await this.auditAttempt({ objectId: `reference:${input.kind}`, objectType: "account", requestId, result: "success", tool: "editorial_reference_options" });
        return agentSuccess({ options: result.docs.map((item) => ({ id: item.id, label: item.alt, kind: input.kind })), page: result.page ?? page, limit, totalDocs: result.totalDocs, totalPages: result.totalPages }, { requestId });
      }
      const result = await this.payload.find({
        collection: "taxonomies", depth: 0, limit, page, overrideAccess: false, req,
        select: { name: true }, sort: "name", user,
        where: { and: [
          { dimension: { equals: input.kind } },
          ...(query ? [{ name: { contains: query } }] : []),
        ] },
      });
      await this.auditAttempt({ objectId: `reference:${input.kind}`, objectType: "account", requestId, result: "success", tool: "editorial_reference_options" });
      return agentSuccess({ options: result.docs.map((item) => ({ id: item.id, label: item.name, kind: input.kind })), page: result.page ?? page, limit, totalDocs: result.totalDocs, totalPages: result.totalPages }, { requestId });
    } catch (error) {
      await this.auditReadFailure("editorial_reference_options", requestId, error, `reference:${String(input.kind)}`);
      return failure(error, requestId);
    }
  }

  async editorialArticleGet(id: number, options: { bodyVersion?: typeof AGENT_BODY_VERSION | typeof AGENT_BODY_V2_VERSION } = {}) {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      const article = await this.editorialArticle(id, user);
      const latest = await getLatestDraftArticle(this.payload, article.id, article);
      const currentRevision = revision(latest);
      const req = await createLocalReq({ user }, this.payload);
      let body: AgentArticleBody;
      if (options.bodyVersion === AGENT_BODY_V2_VERSION) {
        const altById = await this.bodyMediaAltById(latest, user);
        body = lexicalToAgentBodyV2(latest.body.root, { mediaAlt: (mediaId) => altById.get(String(mediaId)) ?? null });
      } else {
        body = lexicalToAgentBody(latest.body.root);
      }
      const curationIssue = await editorialCurationIssue(latest, req);
      const siteFields = await this.editorialSiteFields(latest, user, req);
      await this.auditAttempt({ objectId: String(latest.id), objectType: "article", requestId, result: "success", tool: "editorial_article_get" });
      return agentSuccess({
        ...articleSummary(latest),
        revision: currentRevision,
        body,
        markdown: agentBodyToMarkdown(body),
        summary: latest.summary ?? null,
        ...siteFields,
        publicPath: `/${latest.locale}/posts/${latest.slug}`,
        curationIssues: curationIssue ? [curationIssue] : [],
      }, { requestId, meta: { objectId: String(latest.id), revision: currentRevision } });
    } catch (error) {
      await this.auditReadFailure("editorial_article_get", requestId, error, String(id));
      return failure(error, requestId);
    }
  }

  private async editorialTaxonomyIDs(ids: number[], dimension: "geography" | "purpose" | "situation" | "topic", user: User, req: PayloadRequest) {
    if (ids.length > 50 || ids.some((id) => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
      throw new AgentServiceError("VALIDATION_ERROR", `${dimension} IDs must contain at most 50 unique positive integers.`);
    }
    if (!ids.length) return [];
    const result = await this.payload.find({
      collection: "taxonomies",
      depth: 0,
      limit: ids.length,
      overrideAccess: false,
      pagination: false,
      req,
      user,
      where: { and: [{ id: { in: ids } }, { dimension: { equals: dimension } }] },
    });
    if (result.docs.length !== ids.length) throw new AgentServiceError("VALIDATION_ERROR", `Every ${dimension} ID must reference that taxonomy dimension.`);
    return ids;
  }

  private async lockEditorialTaxonomies(
    req: PayloadRequest,
    groups: { dimension: "geography" | "purpose" | "situation" | "topic"; ids: number[] }[],
  ) {
    for (const { dimension, ids } of groups) {
      if (ids.length > 50 || ids.some((id) => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
        throw new AgentServiceError("VALIDATION_ERROR", `${dimension} IDs must contain at most 50 unique positive integers.`);
      }
    }
    const ids = [...new Set(groups.flatMap(({ ids: groupIDs }) => groupIDs))].sort((left, right) => left - right);
    if (!ids.length) return;
    const transactionId = await req.transactionID;
    const db = transactionId
      ? (this.payload.db.sessions?.[String(transactionId)]?.db as { execute: (query: unknown) => Promise<{ rows?: { id: number }[] }> } | undefined)
      : undefined;
    if (!db) throw new AgentServiceError("TEMPORARY_FAILURE", "The editorial taxonomy transaction is unavailable.");
    for (const id of ids) await db.execute(sql`SELECT id FROM taxonomies WHERE id = ${id} FOR SHARE`);
  }

  private editorialSourceNotes(sourceNotes: NonNullable<AgentEditorialSitePatch["sourceNotes"]>, article: Article) {
    if (sourceNotes.length > 50) throw new AgentServiceError("VALIDATION_ERROR", "Source notes may contain at most 50 items.");
    const existingIds = new Set((article.sourceNotes ?? []).map((source) => source.id).filter((id): id is string => Boolean(id)));
    const seen = new Set<string>();
    return sourceNotes.map((source) => {
      if (!source.label.trim() || source.label.length > 500) throw new AgentServiceError("VALIDATION_ERROR", "Every source requires a label of at most 500 characters.");
      if (source.url != null) {
        if (source.url.length > 2_048) throw new AgentServiceError("VALIDATION_ERROR", "Source URLs must be at most 2048 characters.");
        try {
          const url = new URL(source.url);
          if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsafe source protocol");
        } catch {
          throw new AgentServiceError("VALIDATION_ERROR", "Source URLs must use valid http or https URLs.");
        }
      }
      if (source.checkedAt != null && !isISODateTime(source.checkedAt)) throw new AgentServiceError("VALIDATION_ERROR", "Source checkedAt must be an ISO date-time.");
      if (source.check != null && source.check.length > 10_000) throw new AgentServiceError("VALIDATION_ERROR", "Source checks must be at most 10000 characters.");
      if (source.id) {
        if (!existingIds.has(source.id)) throw new AgentServiceError("VALIDATION_ERROR", "A source row ID does not belong to this Article.");
        if (seen.has(source.id)) throw new AgentServiceError("VALIDATION_ERROR", "Source row IDs must be unique.");
        seen.add(source.id);
      }
      return { id: source.id, label: source.label.trim(), url: source.url ?? null, checkedAt: source.checkedAt ?? null, check: source.check ?? null };
    });
  }

  private editorialComments(comments: NonNullable<AgentEditorialSitePatch["editorComments"]>, article: Article, user: User) {
    if (comments.length > 50) throw new AgentServiceError("VALIDATION_ERROR", "Editor comments may contain at most 50 items.");
    const existing = new Map<string, NonNullable<Article["editorComments"]>[number]>();
    for (const comment of article.editorComments ?? []) {
      if (!comment.id) throw new AgentServiceError("VALIDATION_ERROR", "An existing editor comment has no stable row ID and cannot be replaced safely.");
      existing.set(comment.id, comment);
    }
    const seen = new Set<string>();
    return comments.map((comment) => {
      if (!comment.anchor.trim() || comment.anchor.length > 500) throw new AgentServiceError("VALIDATION_ERROR", "Every editor comment requires an anchor of at most 500 characters.");
      if (!comment.message.trim() || comment.message.length > 10_000) throw new AgentServiceError("VALIDATION_ERROR", "Every editor comment requires a message of at most 10000 characters.");
      if (comment.id) {
        const prior = existing.get(comment.id);
        if (!prior) throw new AgentServiceError("VALIDATION_ERROR", "An editor comment row ID does not belong to this Article.");
        if (seen.has(comment.id)) throw new AgentServiceError("VALIDATION_ERROR", "Editor comment row IDs must be unique.");
        seen.add(comment.id);
        return { id: comment.id, anchor: comment.anchor.trim(), message: comment.message.trim(), resolved: comment.resolved ?? Boolean(prior.resolved), createdBy: articleRelationID(prior.createdBy) };
      }
      return { anchor: comment.anchor.trim(), message: comment.message.trim(), resolved: comment.resolved ?? false, createdBy: user.id };
    });
  }

  private async editorialSaveData(patch: AgentEditorialSitePatch, article: Article, user: User, req: PayloadRequest) {
    const allowed = new Set(["assignedEditorId", "coverImageId", "editorComments", "format", "freshnessDate", "geographyIds", "purposeIds", "situationIds", "sourceNotes", "topicIds"]);
    const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
    if (!entries.length) throw new AgentServiceError("VALIDATION_ERROR", "At least one editorial site field is required.");
    if (entries.some(([key]) => !allowed.has(key))) throw new AgentServiceError("VALIDATION_ERROR", "The editorial patch contains a protected or unknown field.");
    await this.lockEditorialTaxonomies(req, [
      ...(patch.purposeIds === undefined ? [] : [{ dimension: "purpose" as const, ids: patch.purposeIds }]),
      ...(patch.topicIds === undefined ? [] : [{ dimension: "topic" as const, ids: patch.topicIds }]),
      ...(patch.geographyIds === undefined ? [] : [{ dimension: "geography" as const, ids: patch.geographyIds }]),
      ...(patch.situationIds === undefined ? [] : [{ dimension: "situation" as const, ids: patch.situationIds }]),
    ]);
    const data: Record<string, unknown> = {};
    if (patch.assignedEditorId !== undefined) {
      const assignedEditorId = patch.assignedEditorId;
      if (assignedEditorId !== null && (!Number.isInteger(assignedEditorId) || assignedEditorId <= 0)) throw new AgentServiceError("VALIDATION_ERROR", "Assigned Editor must be a positive User ID or null.");
      if (!isSuperAdmin(user) && assignedEditorId !== null && assignedEditorId !== user.id) throw new AgentServiceError("FORBIDDEN", "An Editor may only assign the Article to themselves or leave it unassigned.");
      if (assignedEditorId !== null) {
        let candidate: Pick<User, "accountStatus" | "id" | "role">;
        if (assignedEditorId === user.id) candidate = user;
        else candidate = await this.lockEditorialAssignee(req, assignedEditorId);
        if (candidate.accountStatus !== "active" || (candidate.role !== "editor" && candidate.role !== "super_admin")) {
          throw new AgentServiceError("VALIDATION_ERROR", "Assigned Editor must be an active Editor or Super Admin.");
        }
      }
      data.assignedEditor = assignedEditorId;
    }
    if (patch.format !== undefined) {
      if (patch.format !== null && !["guide", "reporting", "analysis", "first_person", "update"].includes(patch.format)) throw new AgentServiceError("VALIDATION_ERROR", "Unknown Article format.");
      data.format = patch.format;
    }
    if (patch.purposeIds !== undefined) data.purposes = await this.editorialTaxonomyIDs(patch.purposeIds, "purpose", user, req);
    if (patch.topicIds !== undefined) data.topics = await this.editorialTaxonomyIDs(patch.topicIds, "topic", user, req);
    if (patch.geographyIds !== undefined) data.geographies = await this.editorialTaxonomyIDs(patch.geographyIds, "geography", user, req);
    if (patch.situationIds !== undefined) data.situations = await this.editorialTaxonomyIDs(patch.situationIds, "situation", user, req);
    if (patch.sourceNotes !== undefined) data.sourceNotes = this.editorialSourceNotes(patch.sourceNotes, article);
    if (patch.freshnessDate !== undefined) {
      if (patch.freshnessDate !== null && !isISODate(patch.freshnessDate) && !isISODateTime(patch.freshnessDate)) throw new AgentServiceError("VALIDATION_ERROR", "Freshness date must be an ISO date.");
      data.freshnessDate = patch.freshnessDate;
    }
    if (patch.editorComments !== undefined) data.editorComments = this.editorialComments(patch.editorComments, article, user);
    if (patch.coverImageId !== undefined) {
      if (patch.coverImageId !== null) {
        if (!Number.isInteger(patch.coverImageId) || patch.coverImageId <= 0) throw new AgentServiceError("VALIDATION_ERROR", "Cover image must be a positive Media ID or null.");
        await this.lockMedia(req, patch.coverImageId);
        await assertMediaApprovedForPublicUse(patch.coverImageId, req, "Cover image");
      }
      data.coverImage = patch.coverImageId;
    }
    return data;
  }

  async editorialSaveSiteFields(input: { id: number; idempotencyKey: string; patch: AgentEditorialSitePatch; revision: string }) {
    let requestId = createAgentRequestId();
    try {
      requestId = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "editorial_save_site_fields" });
      requireRevision(input.revision);
      const user = await this.currentUser();
      if (!hasEditorialRole(user)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
      const fingerprint = inputFingerprint(input);
      const prior = await this.replayedEditorialWrite(requestId, fingerprint, user);
      if (prior) {
        const result = { ...articleSummary(prior), ...await this.editorialSiteFields(prior, user), publicPath: `/${prior.locale}/posts/${prior.slug}` };
        return agentSuccess(result, { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(prior.id), readAfterWrite: true, revision: revision(prior) } });
      }
      let outcome: { article: Article; auditId: string; kind: "saved" } | { kind: "conflict"; revision: string };
      try {
        outcome = await this.withWriteTransaction(user, async (req) => {
          const lockedUser = await this.lockActorContext(req);
          if (!hasEditorialRole(lockedUser)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
          const event = await this.reserveWrite({ fingerprint, requestId, tool: "editorial_save_site_fields" }, req);
          await this.lockArticle(req, input.id);
          const found = await this.editorialArticle(input.id, lockedUser, req);
          const article = await getLatestDraftArticle(this.payload, found.id, found, req);
          if (article.authorshipType !== "member") throw new AgentServiceError("FORBIDDEN", "Only existing Member-authored Articles can use this editorial save.");
          const beforeRevision = revision(article);
          if (input.revision !== beforeRevision) {
            await this.finishWrite(event.id, { beforeRevision, objectId: String(article.id), result: "conflict" }, req);
            return { kind: "conflict" as const, revision: beforeRevision };
          }
          const invariantSource = article.publicationStatus === "published"
            ? await this.payload.findByID({ collection: "articles", id: article.id, depth: 0, draft: false, overrideAccess: false, req, user: lockedUser }) as Article
            : found;
          const invariants = editorialInvariantSnapshot(invariantSource);
          const data = await this.editorialSaveData(input.patch, article, lockedUser, req);
          const saved = await this.payload.update({
            collection: "articles",
            id: article.id,
            data: data as never,
            depth: 0,
            draft: false,
            overrideAccess: false,
            req,
            user: lockedUser,
          }) as Article;
          const savedInvariants = editorialInvariantSnapshot(saved);
          if (canonicalJSON(savedInvariants) !== canonicalJSON(invariants)) {
            const changedFields = Object.keys(invariants).filter((key) => canonicalJSON(invariants[key as keyof typeof invariants]) !== canonicalJSON(savedInvariants[key as keyof typeof savedInvariants]));
            throw new AgentServiceError("TEMPORARY_FAILURE", "The editorial save changed a protected Article field.", { changedFields });
          }
          const afterRevision = revision(saved);
          await this.finishWrite(event.id, { afterRevision, beforeRevision, objectId: String(saved.id), result: "success" }, req);
          return { article: saved, auditId: String(event.id), kind: "saved" as const };
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedEditorialWrite(requestId, fingerprint, user);
        if (!replay) throw error.original;
        outcome = { article: replay, auditId: "", kind: "saved" };
      }
      if (outcome.kind === "conflict") throw new AgentServiceError("REVISION_CONFLICT", "The Article changed after the editorial fields were loaded.", { latestRevision: outcome.revision });
      const saved = outcome.article;
      const result = { ...articleSummary(saved), ...await this.editorialSiteFields(saved, user), publicPath: `/${saved.locale}/posts/${saved.slug}` };
      return agentSuccess(result, { requestId, meta: { ...(outcome.auditId ? { auditId: outcome.auditId } : {}), idempotencyKey: input.idempotencyKey, objectId: String(saved.id), readAfterWrite: true, revision: revision(saved) } });
    } catch (error) {
      if (!(error instanceof AgentServiceError && ["IDEMPOTENCY_CONFLICT", "REVISION_CONFLICT"].includes(error.code))) {
        await this.auditReadFailure("editorial_save_site_fields", requestId, error, String(input.id));
      }
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

  private async lockEditorialAssignee(req: PayloadRequest, id: number): Promise<Pick<User, "accountStatus" | "id" | "role">> {
    const transactionId = await req.transactionID;
    const db = transactionId
      ? (this.payload.db.sessions?.[String(transactionId)]?.db as { execute: (query: unknown) => Promise<{ rows?: Record<string, unknown>[] }> } | undefined)
      : undefined;
    if (!db) throw new AgentServiceError("TEMPORARY_FAILURE", "The editorial assignee transaction is unavailable.");
    const row = (await db.execute(sql`SELECT id, account_status, role FROM users WHERE id = ${id} FOR SHARE`)).rows?.[0];
    if (!row) throw new AgentServiceError("VALIDATION_ERROR", "Assigned Editor was not found.");
    return { id: Number(row.id), accountStatus: String(row.account_status) as User["accountStatus"], role: String(row.role) as User["role"] };
  }

  private async lockNotificationOwner(req: PayloadRequest, id: number): Promise<Pick<User, "accountStatus" | "displayName" | "email" | "id">> {
    const transactionId = await req.transactionID;
    const db = transactionId
      ? (this.payload.db.sessions?.[String(transactionId)]?.db as { execute: (query: unknown) => Promise<{ rows?: Record<string, unknown>[] }> } | undefined)
      : undefined;
    if (!db) throw new AgentServiceError("TEMPORARY_FAILURE", "The notification owner transaction is unavailable.");
    const row = (await db.execute(sql`SELECT id, account_status, display_name, email FROM users WHERE id = ${id} FOR SHARE`)).rows?.[0];
    if (!row) throw new AgentServiceError("VALIDATION_ERROR", "The Article owner is unavailable for notification.");
    return {
      id: Number(row.id),
      accountStatus: String(row.account_status) as User["accountStatus"],
      displayName: String(row.display_name),
      email: String(row.email),
    };
  }

  private async lockSiteSelectionMedia(req: PayloadRequest, article: Article) {
    const ids = new Set<number>();
    const coverId = articleRelationID(article.coverImage);
    if (typeof coverId === "number") ids.add(coverId);
    const authorId = articleRelationID(article.author);
    if (typeof authorId === "number") {
      const author = await this.payload.findByID({ collection: "people", id: authorId, depth: 0, overrideAccess: true, req });
      const portraitId = articleRelationID(author.portrait);
      if (typeof portraitId === "number") ids.add(portraitId);
    }
    for (const id of ids) await this.lockMedia(req, id);
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

  private async lockWorkflowEvent(req: PayloadRequest, id: number) {
    const transactionId = await req.transactionID;
    const db = transactionId
      ? (this.payload.db.sessions?.[String(transactionId)]?.db as { execute: (query: unknown) => Promise<{ rows?: { id: number }[] }> } | undefined)
      : undefined;
    if (!db) throw new AgentServiceError("TEMPORARY_FAILURE", "The notification delivery transaction is unavailable.");
    const result = await db.execute(sql`SELECT id FROM workflow_events WHERE id = ${id} FOR UPDATE`);
    if (!result.rows?.[0]) throw new AgentServiceError("TEMPORARY_FAILURE", "The notification event is unavailable.");
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
      || connection.person_id == null
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

  private assertSiteSelectionActor(payload: SiteSelectionConfirmationPayload) {
    if (
      payload.userId !== this.actor.userId
      || payload.personId !== this.actor.personId
      || payload.connectionId !== this.actor.connectionId
    ) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The site selection confirmation belongs to a different connection.");
    }
  }

  private assertSiteSelectionEvent(event: AgentEvent | undefined, payload: SiteSelectionConfirmationPayload) {
    if (!event
      || event.tool !== "editorial_prepare_site_selection"
      || event.objectId !== String(payload.articleId)
      || articleRelationID(event.user) !== payload.userId
      || articleRelationID(event.connection) !== payload.connectionId
    ) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The site selection confirmation is invalid.");
    }
    if (event.result !== "pending") {
      throw new AgentServiceError("CONFIRMATION_USED", "The site selection confirmation was already used. Prepare the action again.");
    }
    if (event.beforeRevision !== payload.revision) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The site selection confirmation revision is invalid.");
    }
  }

  private assertProfileConfirmationActor(payload: ProfilePublicationConfirmationPayload) {
    if (
      payload.userId !== this.actor.userId
      || payload.personId !== this.actor.personId
      || payload.connectionId !== this.actor.connectionId
    ) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The profile publication confirmation belongs to a different connection.");
    }
  }

  private assertProfileConfirmationEvent(event: AgentEvent | undefined, payload: ProfilePublicationConfirmationPayload) {
    if (!event
      || event.tool !== "my_profile_prepare_publication"
      || event.objectType !== "account"
      || event.objectId !== String(payload.personId)
      || articleRelationID(event.user) !== payload.userId
      || articleRelationID(event.connection) !== payload.connectionId
    ) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The profile publication confirmation is invalid.");
    }
    if (event.result !== "pending") {
      throw new AgentServiceError("CONFIRMATION_USED", "The profile publication confirmation was already used. Prepare the action again.");
    }
    if (event.beforeRevision !== payload.revision) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The profile publication confirmation revision is invalid.");
    }
  }

  private assertHomepageConfirmationActor(payload: HomepageScheduleConfirmationPayload, user: User) {
    if (
      payload.userId !== this.actor.userId
      || payload.personId !== this.actor.personId
      || payload.connectionId !== this.actor.connectionId
      || payload.role !== user.role
    ) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The homepage schedule confirmation belongs to a different actor or role.");
    }
  }

  private assertHomepageConfirmationEvent(event: AgentEvent | undefined, payload: HomepageScheduleConfirmationPayload) {
    if (!event
      || event.tool !== "editorial_prepare_homepage_schedule"
      || event.objectId !== String(payload.articleId)
      || articleRelationID(event.user) !== payload.userId
      || articleRelationID(event.connection) !== payload.connectionId
    ) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The homepage schedule confirmation is invalid.");
    }
    if (event.result !== "pending") throw new AgentServiceError("CONFIRMATION_USED", "The homepage schedule confirmation was already used. Prepare the action again.");
    if (event.beforeRevision !== payload.revision) throw new AgentServiceError("CONFIRMATION_INVALID", "The homepage schedule confirmation revision is invalid.");
  }

  private assertMajorEditConfirmationActor(payload: MajorEditNotificationConfirmationPayload, user: User) {
    if (
      payload.userId !== this.actor.userId
      || payload.personId !== this.actor.personId
      || payload.connectionId !== this.actor.connectionId
      || payload.role !== user.role
    ) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The major-edit notification confirmation belongs to a different actor or role.");
    }
  }

  private assertMajorEditConfirmationEvent(event: AgentEvent | undefined, payload: MajorEditNotificationConfirmationPayload) {
    if (!event
      || event.tool !== "editorial_prepare_major_edit_notification"
      || event.objectId !== String(payload.articleId)
      || articleRelationID(event.user) !== payload.userId
      || articleRelationID(event.connection) !== payload.connectionId
    ) {
      throw new AgentServiceError("CONFIRMATION_INVALID", "The major-edit notification confirmation is invalid.");
    }
    if (event.result !== "pending") throw new AgentServiceError("CONFIRMATION_USED", "The major-edit notification confirmation was already used. Prepare the action again.");
    if (event.beforeRevision !== payload.revision) throw new AgentServiceError("CONFIRMATION_INVALID", "The major-edit notification confirmation revision is invalid.");
  }

  private async reserveWrite(input: { fingerprint: string; idempotencyDigest?: string; objectType?: "account" | "article"; requestId: string; tool: AgentToolName }, req: PayloadRequest) {
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
          objectType: input.objectType ?? "article",
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

  private async replayedEditorialWrite(requestId: string, fingerprint: string, user: User) {
    const prior = await this.priorWrite(requestId);
    if (!prior) return null;
    if (prior.inputFingerprint !== fingerprint) throw new AgentServiceError("IDEMPOTENCY_CONFLICT", "The idempotency key was already used with different input.");
    if (prior.result === "conflict") throw new AgentServiceError("REVISION_CONFLICT", "The Article changed after the editorial fields were loaded.", { latestRevision: prior.beforeRevision });
    if (prior.result !== "success" || !prior.objectId || !prior.afterRevision) throw new AgentServiceError("TEMPORARY_FAILURE", "The previous editorial save has no readable result.");
    const found = await this.editorialArticle(Number(prior.objectId), user);
    const article = await getLatestDraftArticle(this.payload, found.id, found);
    if (article.authorshipType !== "member") throw new AgentServiceError("FORBIDDEN", "Only existing Member-authored Articles can use this editorial save.");
    if (revision(article) !== prior.afterRevision) throw new AgentServiceError("TEMPORARY_FAILURE", "The saved editorial result changed after the previous write.");
    return article;
  }

  private async replayedProfileWrite(requestId: string, fingerprint: string, user: User) {
    const prior = await this.priorWrite(requestId);
    if (!prior) return null;
    if (prior.inputFingerprint !== fingerprint) {
      throw new AgentServiceError("IDEMPOTENCY_CONFLICT", "The idempotency key was already used with different input.");
    }
    if (prior.result === "conflict") {
      throw new AgentServiceError("REVISION_CONFLICT", "The profile changed after it was loaded.", { latestRevision: prior.beforeRevision });
    }
    if (prior.result !== "success" || prior.objectId !== String(this.actor.personId)) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The previous profile write has no readable result.");
    }
    return this.currentPerson(user);
  }

  private async readableMedia(id: number, user: User) {
    const req = await createLocalReq({ user }, this.payload);
    try {
      return await this.payload.findByID({ collection: "media", id, depth: 0, overrideAccess: false, req, user }) as Media;
    } catch {
      throw new AgentServiceError("NOT_FOUND", "Media not found.");
    }
  }

  private async replayedMediaUpload(requestId: string, fingerprint: string, user: User) {
    const prior = await this.priorWrite(requestId);
    if (!prior) return null;
    if (prior.inputFingerprint !== fingerprint) {
      throw new AgentServiceError("IDEMPOTENCY_CONFLICT", "The idempotency key was already used with different input.");
    }
    if (prior.result !== "success" || !prior.objectId) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The previous upload has no readable result.");
    }
    return this.readableMedia(Number(prior.objectId), user);
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
    await this.publicationArticle(Number(prior.objectId), user);
    if (stored.result.article.revision !== prior.afterRevision) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The stored publication result is inconsistent.");
    }
    return stored.result;
  }

  private async replayedSiteSelection(idempotencyDigest: string, fingerprint: string, user: User) {
    const prior = await this.priorWrite(idempotencyDigest);
    if (!prior) return null;
    const stored = readStoredSiteSelectionFingerprint(prior.inputFingerprint);
    const priorFingerprint = stored?.fingerprint ?? prior.inputFingerprint;
    if (priorFingerprint !== fingerprint) {
      throw new AgentServiceError("IDEMPOTENCY_CONFLICT", "The idempotency key was already used with different input.");
    }
    if (prior.result === "conflict") {
      throw new AgentServiceError("REVISION_CONFLICT", "The article changed after this site selection action was prepared.", { latestRevision: prior.beforeRevision });
    }
    if (prior.result !== "success" || !prior.objectId || !prior.afterRevision || !stored) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The previous site selection has no readable result.");
    }
    await this.editorialArticle(Number(prior.objectId), user);
    if (stored.result.article.revision !== prior.afterRevision) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The stored site selection result is inconsistent.");
    }
    return stored.result;
  }

  private async replayedHomepageSchedule(idempotencyDigest: string, fingerprint: string, user: User) {
    const prior = await this.priorWrite(idempotencyDigest);
    if (!prior) return null;
    const stored = readStoredHomepageScheduleFingerprint(prior.inputFingerprint);
    const priorFingerprint = stored?.fingerprint ?? prior.inputFingerprint;
    if (priorFingerprint !== fingerprint) throw new AgentServiceError("IDEMPOTENCY_CONFLICT", "The idempotency key was already used with different input.");
    if (prior.result === "conflict") throw new AgentServiceError("REVISION_CONFLICT", "The Article changed after this homepage schedule was prepared.", { latestRevision: prior.beforeRevision });
    if (prior.result !== "success" || !prior.objectId || !prior.afterRevision || !stored) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The previous homepage schedule has no readable result.");
    }
    await this.editorialArticle(Number(prior.objectId), user);
    if (stored.result.article.revision !== prior.afterRevision) throw new AgentServiceError("TEMPORARY_FAILURE", "The stored homepage schedule result is inconsistent.");
    return stored.result;
  }

  private async replayedMajorEditNotification(
    idempotencyDigest: string,
    fingerprint: string,
    expectedNotificationKey: string,
    user: User,
  ) {
    const prior = await this.priorWrite(idempotencyDigest);
    if (!prior) return null;
    const stored = readStoredMajorEditNotificationFingerprint(prior.inputFingerprint);
    const priorFingerprint = stored?.fingerprint ?? prior.inputFingerprint;
    if (priorFingerprint !== fingerprint) throw new AgentServiceError("IDEMPOTENCY_CONFLICT", "The idempotency key was already used with different input.");
    if (prior.result === "conflict") throw new AgentServiceError("REVISION_CONFLICT", "The Article changed after this notification was prepared.", { latestRevision: prior.beforeRevision });
    if (prior.result !== "success" || !prior.objectId || !prior.afterRevision || !stored) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The previous notification commit has no readable result.");
    }
    await this.editorialArticle(stored.result.articleId, user);
    const event = await this.payload.findByID({ collection: "workflow-events", id: stored.result.eventId, depth: 0, overrideAccess: true }) as WorkflowEvent;
    if (
      Number(event.id) !== stored.result.eventId
      || articleRelationID(event.article) !== stored.result.articleId
      || event.notificationKind !== "major_edit"
      || event.notificationKey !== expectedNotificationKey
      || stored.result.revision !== prior.afterRevision
    ) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The stored notification event is inconsistent.");
    }
    return { event, stored: stored.result };
  }

  private async deliverMajorEditNotificationEvent(event: WorkflowEvent, expectedNotificationKey: string, user: User) {
    if (event.notificationStatus === "sent" || event.notificationStatus === "not_required") return event;
    const observedAttempts = event.notificationAttempts ?? 0;
    return this.withWriteTransaction(user, async (req) => {
      const lockedUser = await this.lockActorContext(req);
      if (!hasEditorialRole(lockedUser)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
      await this.lockWorkflowEvent(req, Number(event.id));
      const current = await this.payload.findByID({ collection: "workflow-events", id: event.id, depth: 0, overrideAccess: true, req }) as WorkflowEvent;
      if (current.notificationKind !== "major_edit" || current.notificationKey !== expectedNotificationKey) {
        throw new AgentServiceError("TEMPORARY_FAILURE", "The notification event is inconsistent.");
      }
      if (current.notificationStatus === "sent" || current.notificationStatus === "not_required") return current;
      if ((current.notificationAttempts ?? 0) !== observedAttempts) return current;
      const articleId = articleRelationID(current.article);
      if (typeof articleId !== "number" || !current.notificationRecipient?.trim()) {
        throw new AgentServiceError("TEMPORARY_FAILURE", "The notification event cannot be delivered safely.");
      }
      const article = await this.editorialArticle(articleId, lockedUser, req);
      await deliverEditorialNotification(this.payload, current, article, { email: current.notificationRecipient }, req);
      return this.payload.findByID({ collection: "workflow-events", id: current.id, depth: 0, overrideAccess: true, req }) as Promise<WorkflowEvent>;
    });
  }

  private async replayedProfilePublication(idempotencyDigest: string, fingerprint: string, user: User) {
    const prior = await this.priorWrite(idempotencyDigest);
    if (!prior) return null;
    const stored = readStoredProfilePublicationFingerprint(prior.inputFingerprint);
    const priorFingerprint = stored?.fingerprint ?? prior.inputFingerprint;
    if (priorFingerprint !== fingerprint) {
      throw new AgentServiceError("IDEMPOTENCY_CONFLICT", "The idempotency key was already used with different input.");
    }
    if (prior.result === "conflict") {
      throw new AgentServiceError("REVISION_CONFLICT", "The profile changed after this publication action was prepared.", { latestRevision: prior.beforeRevision });
    }
    if (prior.result !== "success" || prior.objectId !== String(this.actor.personId) || !prior.afterRevision || !stored) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The previous profile publication has no readable result.");
    }
    if (stored.result.revision !== prior.afterRevision) {
      throw new AgentServiceError("TEMPORARY_FAILURE", "The stored profile publication result is inconsistent.");
    }
    const person = await this.currentPerson(user);
    return profilePublicationSummary(person, stored.result.action);
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
    // Profile and media tools audit under "account": agent-events objectType
    // is a frozen enum (account/article/connection).
    const objectType = tool === "account_context"
      || tool === "capabilities_list"
      || tool === "admin_recent_activity"
      || tool === "editorial_reference_options"
      || tool === "media_upload"
      || tool === "my_media_list"
      || tool.startsWith("my_profile_")
      || tool === "my_links_save"
      ? "account"
      : "article";
    await this.auditAttempt({ objectId, objectType, requestId, result: denied ? "denied" : "failed", tool });
  }

  private async saveProfileData(input: {
    data: Record<string, unknown>;
    fingerprintValue: unknown;
    idempotencyKey: string;
    revision: string;
    tool: "my_links_save" | "my_profile_save";
    validate?: (user: User, req: PayloadRequest) => Promise<void>;
  }) {
    let requestId = createAgentRequestId();
    try {
      requireRevision(input.revision);
      requestId = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: input.tool });
      const user = await this.currentUser();
      const fingerprint = inputFingerprint(input.fingerprintValue);
      const prior = await this.replayedProfileWrite(requestId, fingerprint, user);
      if (prior) {
        const result = profileSummary(prior);
        return agentSuccess(result, { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(prior.id), readAfterWrite: true, revision: result.revision } });
      }

      let outcome: { auditId: string; kind: "saved"; person: Person } | { kind: "conflict"; revision: string };
      try {
        outcome = await this.withWriteTransaction(user, async (req) => {
          const lockedUser = await this.lockActorContext(req);
          const event = await this.reserveWrite({ fingerprint, objectType: "account", requestId, tool: input.tool }, req);
          const person = await this.currentPerson(lockedUser, req);
          const beforeRevision = createPersonRevision(person);
          if (beforeRevision !== input.revision) {
            await this.finishWrite(event.id, { beforeRevision, objectId: String(person.id), result: "conflict" }, req);
            return { kind: "conflict" as const, revision: beforeRevision };
          }
          await input.validate?.(lockedUser, req);
          const saved = await this.payload.update({
            collection: "people",
            data: input.data,
            id: person.id,
            overrideAccess: false,
            req,
          }) as Person;
          const afterRevision = createPersonRevision(saved);
          await this.finishWrite(event.id, { afterRevision, beforeRevision, objectId: String(saved.id), result: "success" }, req);
          return { auditId: String(event.id), kind: "saved" as const, person: saved };
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedProfileWrite(requestId, fingerprint, user);
        if (!replay) throw error.original;
        const result = profileSummary(replay);
        return agentSuccess(result, { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(replay.id), readAfterWrite: true, revision: result.revision } });
      }
      if (outcome.kind === "conflict") {
        throw new AgentServiceError("REVISION_CONFLICT", "The profile changed after it was loaded.", { latestRevision: outcome.revision });
      }
      const result = profileSummary(outcome.person);
      return agentSuccess(result, { requestId, meta: { auditId: outcome.auditId, idempotencyKey: input.idempotencyKey, objectId: String(outcome.person.id), readAfterWrite: true, revision: result.revision } });
    } catch (error) {
      if (!(error instanceof AgentServiceError && ["IDEMPOTENCY_CONFLICT", "REVISION_CONFLICT"].includes(error.code))) {
        await this.auditReadFailure(input.tool, requestId, error, String(this.actor.personId));
      }
      return failure(error, requestId);
    }
  }

  async myProfileSave(input: { idempotencyKey: string; patch: AgentProfilePatch; revision: string }) {
    const entries = Object.entries(input.patch).filter(([, value]) => value !== undefined);
    if (!entries.length) return failure(new AgentServiceError("VALIDATION_ERROR", "At least one profile field is required."));
    if (input.patch.name !== undefined && !input.patch.name.trim()) {
      return failure(new AgentServiceError("VALIDATION_ERROR", "Name cannot be empty."));
    }
    for (const values of [input.patch.canHelpWith, input.patch.canHelpWithEs]) {
      if (values && (values.length > 8 || values.some((value) => !value.trim()))) {
        return failure(new AgentServiceError("VALIDATION_ERROR", "Profile help items must contain 0-8 non-empty values."));
      }
    }
    const data: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      if (key === "portraitId") data.portrait = value;
      else if (key === "topicIds") data.topics = value;
      else if (key === "canHelpWith" || key === "canHelpWithEs") data[key] = (value as string[]).map((item) => ({ item }));
      else data[key] = value;
    }
    return this.saveProfileData({
      data,
      fingerprintValue: input,
      idempotencyKey: input.idempotencyKey,
      revision: input.revision,
      tool: "my_profile_save",
      validate: async (user, req) => {
        if (input.patch.portraitId != null) await this.assertMediaUsableByMember(input.patch.portraitId, "Portrait", user, req);
        if (input.patch.topicIds !== undefined) {
          const ids = [...new Set(input.patch.topicIds)];
          if (ids.length !== input.patch.topicIds.length) throw new AgentServiceError("VALIDATION_ERROR", "Topic IDs must be unique.");
          const topics = ids.length ? await this.payload.find({
            collection: "taxonomies",
            depth: 0,
            limit: ids.length,
            overrideAccess: true,
            pagination: false,
            req,
            where: { and: [{ id: { in: ids } }, { dimension: { equals: "topic" } }] },
          }) : { docs: [] };
          if (topics.docs.length !== ids.length) throw new AgentServiceError("VALIDATION_ERROR", "Every topic must reference a Topic taxonomy.");
        }
      },
    });
  }

  async myLinksSave(input: { idempotencyKey: string; links: AgentProfileLink[]; revision: string }) {
    if (input.links.length > 8) return failure(new AgentServiceError("VALIDATION_ERROR", "A profile may have at most 8 links."));
    const allowed = new Set(["personal_site", "newsletter", "youtube", "linkedin", "x", "instagram", "github", "discord", "email", "other"]);
    for (const link of input.links) {
      if (!allowed.has(link.type) || !link.label.trim()) return failure(new AgentServiceError("VALIDATION_ERROR", "Every profile link requires an allowed type and label."));
      const valid = link.type === "email" ? isValidEmailProfileLink(link.url) : isValidWebProfileLink(link.url);
      if (!valid) return failure(new AgentServiceError("VALIDATION_ERROR", link.type === "email" ? "Email links must use a valid mailto address." : "Profile links must use a valid http or https URL."));
    }
    const links = input.links.map(({ type, label, labelEs, url }) => ({ type, label, labelEs: labelEs ?? null, url }));
    return this.saveProfileData({
      data: { links },
      fingerprintValue: { ...input, links },
      idempotencyKey: input.idempotencyKey,
      revision: input.revision,
      tool: "my_links_save",
    });
  }

  async createDraft(input: { body: AgentArticleBody; idempotencyKey: string; locale: "en" | "es"; summary?: string; title: string }) {
    let requestId = createAgentRequestId();
    try {
      requestId = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "article_create_draft" });
      const user = await this.currentUser();
      if (!input.title.trim() || input.title.length > 240) throw new AgentServiceError("VALIDATION_ERROR", "Title is required and must be at most 240 characters.");
      await this.assertWritableBody(input.body, user);
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

  async createTranslationDraft(input: { id: number; idempotencyKey: string }) {
    let requestId = createAgentRequestId();
    try {
      requestId = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "article_create_translation_draft" });
      const user = await this.currentUser();
      const fingerprint = inputFingerprint(input);
      const prior = await this.replayedWrite(requestId, fingerprint, user);
      if (prior) {
        return agentSuccess({ article: articleSummary(prior), created: false }, { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(prior.id), readAfterWrite: true, revision: revision(prior) } });
      }
      let outcome: { article: Article; auditId: string; created: boolean };
      try {
        outcome = await this.withWriteTransaction(user, async (req) => {
          const lockedUser = await this.lockActorContext(req);
          const event = await this.reserveWrite({ fingerprint, requestId, tool: "article_create_translation_draft" }, req);
          await this.lockArticle(req, input.id);
          const source = await this.ownedArticle(input.id, lockedUser, req);
          if (source.authorshipType === "site") throw new AgentServiceError("FORBIDDEN", "Site translations are not available to Member tools.");
          const beforeRevision = await this.latestArticleRevision(source, req);
          const translated = await createArticleTranslationDraft(source.id, req);
          const target = translated.article;
          const targetOwner = relationId(target.owner);
          const targetAuthor = relationId(target.author);
          if (
            target.authorshipType !== "member"
            || targetOwner !== lockedUser.id
            || targetAuthor !== this.actor.personId
            || target.translationGroup !== source.translationGroup
            || target.locale === source.locale
            || target.publicationStatus !== "draft"
          ) {
            throw new AgentServiceError("TEMPORARY_FAILURE", "The translation draft readback did not match the current member and source article.");
          }
          const afterRevision = revision(target);
          await this.finishWrite(event.id, { afterRevision, beforeRevision, objectId: String(target.id), result: "success" }, req);
          return { article: target, auditId: String(event.id), created: translated.created };
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedWrite(requestId, fingerprint, user);
        if (!replay) throw error.original;
        outcome = { article: replay, auditId: "", created: false };
      }
      return agentSuccess({ article: articleSummary(outcome.article), created: outcome.created }, {
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
      if (!(error instanceof AgentServiceError && error.code === "IDEMPOTENCY_CONFLICT")) {
        await this.auditReadFailure("article_create_translation_draft", requestId, error, String(input.id));
      }
      return failure(error, requestId);
    }
  }

  async saveDraft(input: { body: AgentArticleBody; id: number; idempotencyKey: string; revision: string; summary?: string; title: string }) {
    let requestId = createAgentRequestId();
    try {
      requestId = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "article_save_draft" });
      const user = await this.currentUser();
      requireRevision(input.revision);
      if (!input.title.trim() || input.title.length > 240) throw new AgentServiceError("VALIDATION_ERROR", "Title is required and must be at most 240 characters.");
      await this.assertWritableBody(input.body, user);
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

  async mediaUpload(input: { alt: string; data: string; filename: string; idempotencyKey: string; mimeType: string }) {
    let requestId = createAgentRequestId();
    try {
      requestId = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "media_upload" });
      const user = await this.currentUser();
      if (!input.alt.trim()) throw new AgentServiceError("VALIDATION_ERROR", "An image description (alt) is required.");
      if (!input.filename.trim()) throw new AgentServiceError("VALIDATION_ERROR", "A filename is required.");
      if (!/^image\/[\w.+-]+$/.test(input.mimeType)) throw new AgentServiceError("VALIDATION_ERROR", "Only image uploads are supported.");
      const normalized = input.data.replace(/\s+/g, "");
      if (!normalized || normalized.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
        throw new AgentServiceError("VALIDATION_ERROR", "File data must be standard base64.");
      }
      const file = Buffer.from(normalized, "base64");
      if (!file.byteLength) throw new AgentServiceError("VALIDATION_ERROR", "The uploaded file is empty.");
      if (file.byteLength > MAX_AGENT_UPLOAD_BYTES) {
        throw new AgentServiceError("VALIDATION_ERROR", "Image uploads are limited to 10 MB.");
      }
      const fingerprint = inputFingerprint({
        alt: input.alt,
        digest: createHash("sha256").update(file).digest("base64url"),
        filename: input.filename,
        mimeType: input.mimeType,
      });
      const prior = await this.replayedMediaUpload(requestId, fingerprint, user);
      if (prior) {
        return agentSuccess(mediaSummary(prior), { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(prior.id), readAfterWrite: true } });
      }
      let media: Media;
      try {
        media = await this.withWriteTransaction(user, async (req) => {
          const event = await this.reserveWrite({ fingerprint, objectType: "account", requestId, tool: "media_upload" }, req);
          /*
           * Same unique-pathname rule as the web direct-upload pipeline
           * (UniqueVercelBlobClientUploadHandler): the stored filename gets a
           * random suffix so member uploads never collide or overwrite.
           * Ownership (uploadedBy) is set by the Media beforeChange hook from
           * req.user, exactly like a web upload.
           */
          const created = await this.payload.create({
            collection: "media",
            data: { alt: input.alt.trim() },
            file: {
              data: file,
              mimetype: input.mimeType,
              name: uniqueMediaUploadFilename(input.filename, randomUUID()),
              size: file.byteLength,
            },
            overrideAccess: false,
            req,
            user,
          }) as Media;
          await this.finishWrite(event.id, { objectId: String(created.id), result: "success" }, req);
          return created;
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedMediaUpload(requestId, fingerprint, user);
        if (!replay) throw error.original;
        media = replay;
      }
      return agentSuccess(mediaSummary(media), { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(media.id), readAfterWrite: true } });
    } catch (error) {
      if (!(error instanceof AgentServiceError && error.code === "IDEMPOTENCY_CONFLICT")) {
        await this.auditReadFailure("media_upload", requestId, error);
      }
      return failure(error, requestId);
    }
  }

  async setCover(input: { id: number; idempotencyKey: string; mediaId: number; revision: string }) {
    let requestId = createAgentRequestId();
    try {
      requestId = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "article_set_cover" });
      const user = await this.currentUser();
      requireRevision(input.revision);
      if (!Number.isInteger(input.mediaId) || input.mediaId <= 0) {
        throw new AgentServiceError("VALIDATION_ERROR", "A positive media ID is required.");
      }
      const fingerprint = inputFingerprint(input);
      const prior = await this.replayedWrite(requestId, fingerprint, user);
      if (prior) {
        return agentSuccess(coverSummary(prior), { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(prior.id), readAfterWrite: true, revision: revision(prior) } });
      }
      let outcome: { kind: "conflict"; revision: string } | { article: Article; kind: "saved" };
      try {
        outcome = await this.withWriteTransaction(user, async (req) => {
          const event = await this.reserveWrite({ fingerprint, requestId, tool: "article_set_cover" }, req);
          await this.lockArticle(req, input.id);
          const article = await this.ownedArticle(input.id, user, req);
          const beforeRevision = await this.latestArticleRevision(article, req);
          if (input.revision !== beforeRevision) {
            await this.finishWrite(event.id, { beforeRevision, objectId: String(article.id), result: "conflict" }, req);
            return { kind: "conflict" as const, revision: beforeRevision };
          }
          await this.assertMediaUsableByMember(input.mediaId, "Cover image", user, req);
          const saved = await this.payload.update({
            collection: "articles",
            id: article.id,
            draft: true,
            overrideAccess: false,
            req,
            user,
            data: { coverImage: input.mediaId } as never,
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
      return agentSuccess(coverSummary(saved), { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(saved.id), readAfterWrite: true, revision: revision(saved) } });
    } catch (error) {
      if (!(error instanceof AgentServiceError && (error.code === "REVISION_CONFLICT" || error.code === "IDEMPOTENCY_CONFLICT"))) {
        await this.auditReadFailure("article_set_cover", requestId, error, String(input.id));
      }
      return failure(error, requestId);
    }
  }

  async prepareProfilePublication(input: { revision: string; targetStatus: ProfilePublicationTarget }) {
    const requestId = `prep_profile_${input.targetStatus}_${randomUUID()}`;
    try {
      requireRevision(input.revision);
      const user = await this.currentUser();
      const person = await this.currentPerson(user);
      const currentRevision = createPersonRevision(person);
      if (input.revision !== currentRevision) {
        throw new AgentServiceError("REVISION_CONFLICT", "The profile changed after it was loaded.", { latestRevision: currentRevision });
      }
      const completeness = profileCompleteness(person);
      if (input.targetStatus === "public" && !completeness.complete) {
        throw new AgentServiceError("VALIDATION_ERROR", "The profile is incomplete and cannot be public.", { completeness });
      }
      const req = await createLocalReq({ user }, this.payload);
      const prepared = await prepareProfilePublication(person, input.targetStatus, req);
      const expiresAt = Date.now() + (5 * 60 * 1_000);
      const confirmationRef = createProfilePublicationConfirmation({
        action: prepared.action,
        connectionId: this.actor.connectionId,
        exp: expiresAt,
        jti: randomUUID(),
        personId: person.id,
        revision: currentRevision,
        role: user.role,
        targetStatus: input.targetStatus,
        userId: user.id,
        v: 1,
      });
      const event = await this.payload.create({
        collection: "agent-events",
        overrideAccess: true,
        data: {
          user: user.id,
          connection: this.actor.connectionId,
          clientFamily: this.actor.clientFamily,
          tool: "my_profile_prepare_publication",
          objectType: "account",
          objectId: String(person.id),
          requestId,
          idempotencyDigest: profilePublicationConfirmationDigest(confirmationRef),
          inputFingerprint: inputFingerprint({ action: prepared.action, personId: person.id, revision: currentRevision, role: user.role, targetStatus: input.targetStatus }),
          result: "pending",
          beforeRevision: currentRevision,
          occurredAt: new Date().toISOString(),
        },
      });
      return agentSuccess({
        confirmationRef,
        expiresAt: new Date(expiresAt).toISOString(),
        person: profileSummary(person),
        summary: { ...prepared, completeness, publicPath: profilePath(person) },
      }, { requestId, meta: { auditId: String(event.id), objectId: String(person.id), revision: currentRevision } });
    } catch (error) {
      const failureRequestId = auditedFailureRequestId(requestId, error);
      await this.auditReadFailure("my_profile_prepare_publication", failureRequestId, error, String(this.actor.personId));
      return failure(error, failureRequestId);
    }
  }

  async commitProfilePublication(input: { confirmationRef: string; idempotencyKey: string; revision: string }) {
    let requestId = createAgentRequestId();
    let idempotencyDigest: string | undefined;
    let confirmation: ProfilePublicationConfirmationPayload | undefined;
    try {
      requireRevision(input.revision);
      const parsed = readProfilePublicationConfirmation(input.confirmationRef, { allowExpired: true });
      confirmation = parsed;
      this.assertProfileConfirmationActor(parsed);
      idempotencyDigest = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "my_profile_commit_publication" });
      requestId = `${idempotencyDigest}_${parsed.targetStatus}`;
      if (input.revision !== parsed.revision) {
        throw new AgentServiceError("CONFIRMATION_INVALID", "The profile publication confirmation revision does not match this request.");
      }
      const user = await this.currentUser();
      if (user.role !== parsed.role) throw new AgentServiceError("CONFIRMATION_INVALID", "The current role changed after profile publication was prepared.");
      const fingerprint = inputFingerprint({ confirmationDigest: profilePublicationConfirmationDigest(input.confirmationRef), revision: input.revision });
      const prior = await this.replayedProfilePublication(idempotencyDigest, fingerprint, user);
      if (prior) {
        return agentSuccess(prior, { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(parsed.personId), readAfterWrite: true, revision: prior.person.revision } });
      }

      let outcome: { auditId: string; kind: "committed"; person: Person } | { kind: "conflict"; revision: string };
      try {
        outcome = await this.withWriteTransaction(user, async (req) => {
          const lockedUser = await this.lockActorContext(req);
          if (lockedUser.role !== parsed.role) throw new AgentServiceError("CONFIRMATION_INVALID", "The current role changed after profile publication was prepared.");
          if (parsed.exp < Date.now()) throw new PublicationConfirmationError("expired", "The profile publication confirmation expired. Prepare the action again.");
          const commitEvent = await this.reserveWrite({ fingerprint, idempotencyDigest, objectType: "account", requestId, tool: "my_profile_commit_publication" }, req);
          const digest = profilePublicationConfirmationDigest(input.confirmationRef);
          const located = await this.confirmationEvent(digest, req);
          if (!located) throw new AgentServiceError("CONFIRMATION_INVALID", "The profile publication confirmation is invalid.");
          await this.lockAgentEvent(req, Number(located.id));
          const confirmationEvent = await this.confirmationEvent(digest, req);
          this.assertProfileConfirmationEvent(confirmationEvent, parsed);

          const person = await this.currentPerson(lockedUser, req);
          const beforeRevision = createPersonRevision(person);
          if (parsed.targetStatus === "public") {
            const portraitID = relationId(person.portrait);
            if (typeof portraitID === "number") await this.lockMedia(req, portraitID);
          }
          if (parsed.exp < Date.now()) throw new PublicationConfirmationError("expired", "The profile publication confirmation expired. Prepare the action again.");
          if (beforeRevision !== parsed.revision) {
            await this.finishWrite(commitEvent.id, { beforeRevision, objectId: String(person.id), result: "conflict" }, req);
            await this.finishWrite(confirmationEvent!.id, { beforeRevision, objectId: String(person.id), result: "conflict" }, req);
            return { kind: "conflict" as const, revision: beforeRevision };
          }
          const prepared = await prepareProfilePublication(person, parsed.targetStatus, req);
          if (prepared.action !== parsed.action) throw new AgentServiceError("CONFIRMATION_INVALID", "The prepared profile publication action is no longer valid.");
          const committed = await commitProfilePublication(person, parsed.targetStatus, req) as Person;
          if (committed.profileStatus !== parsed.targetStatus) throw new AgentServiceError("TEMPORARY_FAILURE", "The profile visibility readback did not match the requested state.");
          const afterRevision = createPersonRevision(committed);
          const stored: StoredProfilePublicationResult = { action: parsed.action, profileStatus: committed.profileStatus, publicPath: profilePath(committed), revision: afterRevision };
          await this.finishWrite(confirmationEvent!.id, { afterRevision, beforeRevision, objectId: String(committed.id), result: "success" }, req);
          await this.finishWrite(commitEvent.id, { afterRevision, beforeRevision, inputFingerprint: storedProfilePublicationFingerprint(fingerprint, stored), objectId: String(committed.id), result: "success" }, req);
          return { auditId: String(commitEvent.id), kind: "committed" as const, person: committed };
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedProfilePublication(idempotencyDigest, fingerprint, user);
        if (!replay) throw error.original;
        return agentSuccess(replay, { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(parsed.personId), readAfterWrite: true, revision: replay.person.revision } });
      }
      if (outcome.kind === "conflict") {
        throw new AgentServiceError("REVISION_CONFLICT", "The profile changed after this publication action was prepared.", { latestRevision: outcome.revision });
      }
      const result = profilePublicationSummary(outcome.person, parsed.action);
      return agentSuccess(result, { requestId, meta: { auditId: outcome.auditId, idempotencyKey: input.idempotencyKey, objectId: String(outcome.person.id), readAfterWrite: true, revision: result.person.revision } });
    } catch (error) {
      if (!(error instanceof AgentServiceError && ["IDEMPOTENCY_CONFLICT", "REVISION_CONFLICT"].includes(error.code))) {
        const failureRequestId = auditedFailureRequestId(requestId, error);
        await this.auditAttempt({ objectId: confirmation ? String(confirmation.personId) : String(this.actor.personId), objectType: "account", requestId: failureRequestId, result: "failed", tool: "my_profile_commit_publication" });
        return failure(error, failureRequestId);
      }
      return failure(error, requestId);
    }
  }

  async preparePublication(input: { id: number; revision: string; targetStatus: "published" | "withdrawn" }) {
    const requestId = `prep_${input.targetStatus}_${randomUUID()}`;
    try {
      requireRevision(input.revision);
      const user = await this.currentUser();
      const article = await this.publicationArticle(input.id, user);
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
          const article = await this.publicationArticle(parsedConfirmation.articleId, lockedUser, req);
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

  async prepareSiteSelection(input: { id: number; revision: string; targetStatus: EditorialSiteSelectionTarget }) {
    const requestId = `prep_site_${input.targetStatus}_${randomUUID()}`;
    try {
      requireRevision(input.revision);
      const user = await this.currentUser();
      if (!hasEditorialRole(user)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
      const article = await this.editorialArticle(input.id, user);
      const latest = await getLatestDraftArticle(this.payload, article.id, article);
      const currentRevision = revision(latest);
      if (input.revision !== currentRevision) {
        throw new AgentServiceError(
          "REVISION_CONFLICT",
          "The article changed after this editorial copy was loaded.",
          { latestRevision: currentRevision },
        );
      }
      const req = await createLocalReq({ user }, this.payload);
      const prepared = await prepareEditorialSiteSelection(latest, input.targetStatus, req);
      const expiresAt = Date.now() + (5 * 60 * 1_000);
      const confirmationRef = createSiteSelectionConfirmation({
        action: prepared.action,
        articleId: latest.id,
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
          tool: "editorial_prepare_site_selection",
          objectType: "article",
          objectId: String(latest.id),
          requestId,
          idempotencyDigest: siteSelectionConfirmationDigest(confirmationRef),
          inputFingerprint: inputFingerprint({
            action: prepared.action,
            articleId: latest.id,
            revision: currentRevision,
            targetStatus: input.targetStatus,
          }),
          result: "pending",
          beforeRevision: currentRevision,
          occurredAt: new Date().toISOString(),
        },
      });
      return agentSuccess({
        article: { ...articleSummary(latest), revision: currentRevision },
        confirmationRef,
        expiresAt: new Date(expiresAt).toISOString(),
        summary: prepared,
      }, {
        requestId,
        meta: { auditId: String(event.id), objectId: String(latest.id), revision: currentRevision },
      });
    } catch (error) {
      const failureRequestId = auditedFailureRequestId(requestId, error);
      await this.auditReadFailure("editorial_prepare_site_selection", failureRequestId, error, String(input.id));
      return failure(error, failureRequestId);
    }
  }

  async commitSiteSelection(input: { confirmationRef: string; idempotencyKey: string; revision: string }) {
    let requestId = createAgentRequestId();
    let idempotencyDigest: string | undefined;
    let confirmation: SiteSelectionConfirmationPayload | undefined;
    try {
      requireRevision(input.revision);
      const parsedConfirmation = readSiteSelectionConfirmation(input.confirmationRef, { allowExpired: true });
      confirmation = parsedConfirmation;
      this.assertSiteSelectionActor(parsedConfirmation);
      idempotencyDigest = idempotentRequestId(this.actor, {
        idempotencyKey: input.idempotencyKey,
        tool: "editorial_commit_site_selection",
      });
      requestId = `${idempotencyDigest}_${parsedConfirmation.targetStatus}`;
      if (input.revision !== parsedConfirmation.revision) {
        throw new AgentServiceError("CONFIRMATION_INVALID", "The site selection confirmation revision does not match this request.");
      }
      const user = await this.currentUser();
      if (!hasEditorialRole(user)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
      const fingerprint = inputFingerprint({
        confirmationDigest: siteSelectionConfirmationDigest(input.confirmationRef),
        revision: input.revision,
      });
      const prior = await this.replayedSiteSelection(idempotencyDigest, fingerprint, user);
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
          if (!hasEditorialRole(lockedUser)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
          if (parsedConfirmation.exp < Date.now()) {
            throw new PublicationConfirmationError("expired", "The site selection confirmation expired. Prepare the action again.");
          }
          const commitEvent = await this.reserveWrite({
            fingerprint,
            idempotencyDigest,
            requestId,
            tool: "editorial_commit_site_selection",
          }, req);
          const digest = siteSelectionConfirmationDigest(input.confirmationRef);
          const locatedConfirmation = await this.confirmationEvent(digest, req);
          if (!locatedConfirmation) {
            throw new AgentServiceError("CONFIRMATION_INVALID", "The site selection confirmation is invalid.");
          }
          await this.lockAgentEvent(req, Number(locatedConfirmation.id));
          const confirmationEvent = await this.confirmationEvent(digest, req);
          this.assertSiteSelectionEvent(confirmationEvent, parsedConfirmation);

          await this.lockArticle(req, parsedConfirmation.articleId);
          const article = await this.editorialArticle(parsedConfirmation.articleId, lockedUser, req);
          const latest = await getLatestDraftArticle(this.payload, article.id, article, req);
          const beforeRevision = revision(latest);
          if (parsedConfirmation.targetStatus === "curated") await this.lockSiteSelectionMedia(req, latest);
          if (parsedConfirmation.exp < Date.now()) {
            throw new PublicationConfirmationError("expired", "The site selection confirmation expired. Prepare the action again.");
          }
          if (beforeRevision !== parsedConfirmation.revision) {
            await this.finishWrite(commitEvent.id, { beforeRevision, objectId: String(article.id), result: "conflict" }, req);
            await this.finishWrite(confirmationEvent!.id, { beforeRevision, objectId: String(article.id), result: "conflict" }, req);
            return { kind: "conflict" as const, revision: beforeRevision };
          }

          const prepared = await prepareEditorialSiteSelection(latest, parsedConfirmation.targetStatus, req);
          if (prepared.action !== parsedConfirmation.action) {
            throw new AgentServiceError("CONFIRMATION_INVALID", "The prepared site selection action is no longer valid.");
          }
          const committed = await commitEditorialSiteSelection(latest, parsedConfirmation.targetStatus, req, { strictAgentSlice: true });
          const committedVersion = await getLatestDraftArticle(this.payload, committed.id, committed, req);
          const afterRevision = revision(committedVersion);
          const result = siteSelectionSummary(committedVersion, parsedConfirmation.action);
          await this.finishWrite(confirmationEvent!.id, { afterRevision, beforeRevision, objectId: String(committed.id), result: "success" }, req);
          await this.finishWrite(commitEvent.id, {
            afterRevision,
            beforeRevision,
            inputFingerprint: storedSiteSelectionFingerprint(fingerprint, result),
            objectId: String(committed.id),
            result: "success",
          }, req);
          return { article: committedVersion, auditId: String(commitEvent.id), kind: "committed" as const };
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedSiteSelection(idempotencyDigest, fingerprint, user);
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
          "The article changed after this site selection action was prepared.",
          { latestRevision: outcome.revision },
        );
      }
      return agentSuccess(siteSelectionSummary(outcome.article, parsedConfirmation.action), {
        requestId,
        meta: {
          auditId: outcome.auditId,
          idempotencyKey: input.idempotencyKey,
          objectId: String(outcome.article.id),
          readAfterWrite: true,
          revision: revision(outcome.article),
        },
      });
    } catch (error) {
      if (!(error instanceof AgentServiceError && ["IDEMPOTENCY_CONFLICT", "REVISION_CONFLICT"].includes(error.code))) {
        const failureRequestId = auditedFailureRequestId(requestId, error);
        await this.auditAttempt({ objectId: confirmation ? String(confirmation.articleId) : undefined, objectType: "article", requestId: failureRequestId, result: "failed", tool: "editorial_commit_site_selection" });
        return failure(error, failureRequestId);
      }
      return failure(error, requestId);
    }
  }

  async prepareHomepageSchedule(input: { id: number; revision: string } & HomepageScheduleTarget) {
    const requestId = `prep_homepage_${input.placement}_${randomUUID()}`;
    try {
      requireRevision(input.revision);
      const user = await this.currentUser();
      if (!hasEditorialRole(user)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
      const target = this.homepageScheduleTarget(input);
      const { latest, live } = await this.homepageScheduleState(input.id, user);
      const currentRevision = revision(latest);
      if (input.revision !== currentRevision) {
        throw new AgentServiceError("REVISION_CONFLICT", "The Article changed after this homepage schedule was loaded.", { latestRevision: currentRevision });
      }
      const recovery = homepageSchedule(live);
      const expiresAt = Date.now() + (5 * 60 * 1_000);
      const confirmationRef = createHomepageScheduleConfirmation({
        articleId: live.id,
        connectionId: this.actor.connectionId,
        endsAt: target.endsAt,
        exp: expiresAt,
        jti: randomUUID(),
        personId: this.actor.personId,
        placement: target.placement,
        previousEndsAt: recovery.endsAt,
        previousPlacement: recovery.placement,
        previousStartsAt: recovery.startsAt,
        revision: currentRevision,
        role: user.role as "editor" | "super_admin",
        startsAt: target.startsAt,
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
          tool: "editorial_prepare_homepage_schedule",
          objectType: "article",
          objectId: String(live.id),
          requestId,
          idempotencyDigest: homepageScheduleConfirmationDigest(confirmationRef),
          inputFingerprint: inputFingerprint({ articleId: live.id, revision: currentRevision, target, recovery }),
          result: "pending",
          beforeRevision: currentRevision,
          occurredAt: new Date().toISOString(),
        },
      });
      return agentSuccess({
        article: articleSummary(latest),
        confirmationRef,
        expiresAt: new Date(expiresAt).toISOString(),
        summary: {
          target: { ...target, activeNow: homepageScheduleActiveNow(target) },
          current: { ...recovery, activeNow: homepageScheduleActiveNow(recovery) },
          recovery,
          publicEffect: "immediate_public_update" as const,
        },
      }, { requestId, meta: { auditId: String(event.id), objectId: String(live.id), revision: currentRevision } });
    } catch (error) {
      const failureRequestId = auditedFailureRequestId(requestId, error);
      await this.auditReadFailure("editorial_prepare_homepage_schedule", failureRequestId, error, String(input.id));
      return failure(error, failureRequestId);
    }
  }

  async commitHomepageSchedule(input: { confirmationRef: string; idempotencyKey: string; revision: string }) {
    let requestId = createAgentRequestId();
    let idempotencyDigest: string | undefined;
    let confirmation: HomepageScheduleConfirmationPayload | undefined;
    try {
      requireRevision(input.revision);
      const parsed = readHomepageScheduleConfirmation(input.confirmationRef, { allowExpired: true });
      confirmation = parsed;
      const user = await this.currentUser();
      if (!hasEditorialRole(user)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
      this.assertHomepageConfirmationActor(parsed, user);
      idempotencyDigest = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "editorial_commit_homepage_schedule" });
      requestId = `${idempotencyDigest}_${parsed.placement}`;
      if (input.revision !== parsed.revision) throw new AgentServiceError("CONFIRMATION_INVALID", "The homepage schedule confirmation revision does not match this request.");
      const fingerprint = inputFingerprint({ confirmationDigest: homepageScheduleConfirmationDigest(input.confirmationRef), revision: input.revision });
      const replay = await this.replayedHomepageSchedule(idempotencyDigest, fingerprint, user);
      if (replay) {
        return agentSuccess(replay, { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(replay.article.id), readAfterWrite: true, revision: replay.article.revision } });
      }
      if (parsed.exp < Date.now()) throw new PublicationConfirmationError("expired", "The homepage schedule confirmation expired. Prepare the action again.");
      let outcome: { auditId: string; result: HomepageScheduleResult } | { kind: "conflict"; revision: string };
      try {
        outcome = await this.withWriteTransaction(user, async (req) => {
          const lockedUser = await this.lockActorContext(req);
          if (!hasEditorialRole(lockedUser)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
          this.assertHomepageConfirmationActor(parsed, lockedUser);
          if (parsed.exp < Date.now()) throw new PublicationConfirmationError("expired", "The homepage schedule confirmation expired. Prepare the action again.");
          const commitEvent = await this.reserveWrite({ fingerprint, idempotencyDigest, requestId, tool: "editorial_commit_homepage_schedule" }, req);
          const digest = homepageScheduleConfirmationDigest(input.confirmationRef);
          const located = await this.confirmationEvent(digest, req);
          if (!located) throw new AgentServiceError("CONFIRMATION_INVALID", "The homepage schedule confirmation is invalid.");
          await this.lockAgentEvent(req, Number(located.id));
          const confirmationEvent = await this.confirmationEvent(digest, req);
          this.assertHomepageConfirmationEvent(confirmationEvent, parsed);
          await this.lockArticle(req, parsed.articleId);
          const { latest, live } = await this.homepageScheduleState(parsed.articleId, lockedUser, req);
          const beforeRevision = revision(latest);
          if (beforeRevision !== parsed.revision) {
            await this.finishWrite(commitEvent.id, { beforeRevision, objectId: String(live.id), result: "conflict" }, req);
            await this.finishWrite(confirmationEvent!.id, { beforeRevision, objectId: String(live.id), result: "conflict" }, req);
            return { kind: "conflict" as const, revision: beforeRevision };
          }
          const recovery = homepageSchedule(live);
          if (canonicalJSON(recovery) !== canonicalJSON({ placement: parsed.previousPlacement ?? "none", startsAt: parsed.previousStartsAt, endsAt: parsed.previousEndsAt })) {
            throw new AgentServiceError("CONFIRMATION_INVALID", "The prepared homepage recovery values are no longer current.");
          }
          const protectedBefore = homepageProtectedInvariantSnapshot(live);
          await this.payload.update({
            collection: "articles",
            id: live.id,
            data: { homepagePlacement: parsed.placement, homepageStartsAt: parsed.startsAt, homepageEndsAt: parsed.endsAt },
            depth: 0,
            draft: false,
            overrideAccess: false,
            req,
            user: lockedUser,
          });
          const after = await this.homepageScheduleState(live.id, lockedUser, req);
          if (canonicalJSON(homepageProtectedInvariantSnapshot(after.live)) !== canonicalJSON(protectedBefore)) {
            throw new AgentServiceError("TEMPORARY_FAILURE", "The homepage schedule changed a protected Article field.");
          }
          const afterRevision = revision(after.latest);
          const result = homepageScheduleSummary(after.live, recovery);
          await this.finishWrite(confirmationEvent!.id, { afterRevision, beforeRevision, objectId: String(live.id), result: "success" }, req);
          await this.finishWrite(commitEvent.id, { afterRevision, beforeRevision, inputFingerprint: storedHomepageScheduleFingerprint(fingerprint, result), objectId: String(live.id), result: "success" }, req);
          return { auditId: String(commitEvent.id), result };
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedHomepageSchedule(idempotencyDigest, fingerprint, user);
        if (!replay) throw error.original;
        return agentSuccess(replay, { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(replay.article.id), readAfterWrite: true, revision: replay.article.revision } });
      }
      if ("kind" in outcome) throw new AgentServiceError("REVISION_CONFLICT", "The Article changed after this homepage schedule was prepared.", { latestRevision: outcome.revision });
      return agentSuccess(outcome.result, { requestId, meta: { auditId: outcome.auditId, idempotencyKey: input.idempotencyKey, objectId: String(outcome.result.article.id), readAfterWrite: true, revision: outcome.result.article.revision } });
    } catch (error) {
      if (!(error instanceof AgentServiceError && ["IDEMPOTENCY_CONFLICT", "REVISION_CONFLICT"].includes(error.code))) {
        const failureRequestId = auditedFailureRequestId(requestId, error);
        await this.auditAttempt({ objectId: confirmation ? String(confirmation.articleId) : undefined, objectType: "article", requestId: failureRequestId, result: "failed", tool: "editorial_commit_homepage_schedule" });
        return failure(error, failureRequestId);
      }
      return failure(error, requestId);
    }
  }

  async prepareMajorEditNotification(input: { id: number; revision: string }) {
    const requestId = `prep_major_edit_${randomUUID()}`;
    try {
      requireRevision(input.revision);
      const user = await this.currentUser();
      if (!hasEditorialRole(user)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
      const found = await this.editorialArticle(input.id, user);
      const article = await getLatestDraftArticle(this.payload, found.id, found);
      const currentRevision = revision(article);
      if (input.revision !== currentRevision) throw new AgentServiceError("REVISION_CONFLICT", "The Article changed after this notification was loaded.", { latestRevision: currentRevision });
      const owner = await this.majorEditRecipient(article);
      const expiresAt = Date.now() + (5 * 60 * 1_000);
      const confirmationRef = createMajorEditNotificationConfirmation({
        action: "major_edit",
        articleId: article.id,
        connectionId: this.actor.connectionId,
        exp: expiresAt,
        jti: randomUUID(),
        ownerId: owner.id,
        personId: this.actor.personId,
        recipientDigest: majorEditRecipientDigest(owner.email),
        revision: currentRevision,
        role: user.role as "editor" | "super_admin",
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
          tool: "editorial_prepare_major_edit_notification",
          objectType: "article",
          objectId: String(article.id),
          requestId,
          idempotencyDigest: majorEditNotificationConfirmationDigest(confirmationRef),
          inputFingerprint: inputFingerprint({ action: "major_edit", articleId: article.id, ownerId: owner.id, recipientDigest: majorEditRecipientDigest(owner.email), revision: currentRevision }),
          result: "pending",
          beforeRevision: currentRevision,
          occurredAt: new Date().toISOString(),
        },
      });
      return agentSuccess({
        article: articleSummary(article),
        author: { id: owner.id, displayName: owner.displayName },
        confirmationRef,
        expiresAt: new Date(expiresAt).toISOString(),
        summary: { notificationKind: "major_edit" as const, delivery: "account_email" as const },
      }, { requestId, meta: { auditId: String(event.id), objectId: String(article.id), revision: currentRevision } });
    } catch (error) {
      const failureRequestId = auditedFailureRequestId(requestId, error);
      await this.auditReadFailure("editorial_prepare_major_edit_notification", failureRequestId, error, String(input.id));
      return failure(error, failureRequestId);
    }
  }

  async commitMajorEditNotification(input: { confirmationRef: string; idempotencyKey: string; revision: string }) {
    let requestId = createAgentRequestId();
    let idempotencyDigest: string | undefined;
    let confirmation: MajorEditNotificationConfirmationPayload | undefined;
    try {
      requireRevision(input.revision);
      const parsed = readMajorEditNotificationConfirmation(input.confirmationRef, { allowExpired: true });
      confirmation = parsed;
      const user = await this.currentUser();
      if (!hasEditorialRole(user)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
      this.assertMajorEditConfirmationActor(parsed, user);
      idempotencyDigest = idempotentRequestId(this.actor, { idempotencyKey: input.idempotencyKey, tool: "editorial_commit_major_edit_notification" });
      requestId = `${idempotencyDigest}_major_edit`;
      if (input.revision !== parsed.revision) throw new AgentServiceError("CONFIRMATION_INVALID", "The major-edit notification confirmation revision does not match this request.");
      const confirmationDigest = majorEditNotificationConfirmationDigest(input.confirmationRef);
      const fingerprint = inputFingerprint({ confirmationDigest, revision: input.revision });
      const notificationKey = majorEditNotificationKey(input.confirmationRef);
      const replay = await this.replayedMajorEditNotification(idempotencyDigest, fingerprint, notificationKey, user);
      if (replay) {
        const delivered = await this.deliverMajorEditNotificationEvent(replay.event, notificationKey, user);
        return agentSuccess(majorEditNotificationSummary(delivered), { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(replay.stored.articleId), readAfterWrite: true, revision: replay.stored.revision } });
      }
      if (parsed.exp < Date.now()) throw new PublicationConfirmationError("expired", "The major-edit notification confirmation expired. Prepare the action again.");
      let outcome: { articleId: number; auditId: string; event: WorkflowEvent; revision: string } | { kind: "conflict"; revision: string };
      try {
        outcome = await this.withWriteTransaction(user, async (req) => {
          const lockedUser = await this.lockActorContext(req);
          if (!hasEditorialRole(lockedUser)) throw new AgentServiceError("FORBIDDEN", "Editor access is required.");
          this.assertMajorEditConfirmationActor(parsed, lockedUser);
          if (parsed.exp < Date.now()) throw new PublicationConfirmationError("expired", "The major-edit notification confirmation expired. Prepare the action again.");
          const commitEvent = await this.reserveWrite({ fingerprint, idempotencyDigest, requestId, tool: "editorial_commit_major_edit_notification" }, req);
          const located = await this.confirmationEvent(confirmationDigest, req);
          if (!located) throw new AgentServiceError("CONFIRMATION_INVALID", "The major-edit notification confirmation is invalid.");
          await this.lockAgentEvent(req, Number(located.id));
          const confirmationEvent = await this.confirmationEvent(confirmationDigest, req);
          this.assertMajorEditConfirmationEvent(confirmationEvent, parsed);
          await this.lockArticle(req, parsed.articleId);
          const found = await this.editorialArticle(parsed.articleId, lockedUser, req);
          const article = await getLatestDraftArticle(this.payload, found.id, found, req);
          const beforeRevision = revision(article);
          if (beforeRevision !== parsed.revision) {
            await this.finishWrite(commitEvent.id, { beforeRevision, objectId: String(article.id), result: "conflict" }, req);
            await this.finishWrite(confirmationEvent!.id, { beforeRevision, objectId: String(article.id), result: "conflict" }, req);
            return { kind: "conflict" as const, revision: beforeRevision };
          }
          if (article.authorshipType !== "member" || articleRelationID(article.owner) !== parsed.ownerId) {
            throw new AgentServiceError("CONFIRMATION_INVALID", "The prepared notification recipient is no longer valid.");
          }
          const owner = await this.lockNotificationOwner(req, parsed.ownerId);
          if (owner.accountStatus !== "active" || !owner.email.trim() || majorEditRecipientDigest(owner.email) !== parsed.recipientDigest) {
            throw new AgentServiceError("CONFIRMATION_INVALID", "The prepared notification recipient is no longer valid.");
          }
          const workflowEvent = await createEditorialNotificationEvent({
            article,
            fromStatus: article.curationStatus ?? "not_selected",
            kind: "major_edit",
            notificationKey,
            deferDelivery: true,
            req,
            toStatus: article.curationStatus ?? "not_selected",
          });
          if (!workflowEvent) throw new AgentServiceError("VALIDATION_ERROR", "The Member author notification could not be created.");
          const stored = { articleId: article.id, eventId: Number(workflowEvent.id), revision: beforeRevision };
          await this.finishWrite(confirmationEvent!.id, { afterRevision: beforeRevision, beforeRevision, objectId: String(article.id), result: "success" }, req);
          await this.finishWrite(commitEvent.id, { afterRevision: beforeRevision, beforeRevision, inputFingerprint: storedMajorEditNotificationFingerprint(fingerprint, stored), objectId: String(article.id), result: "success" }, req);
          return { articleId: article.id, auditId: String(commitEvent.id), event: workflowEvent as WorkflowEvent, revision: beforeRevision };
        });
      } catch (error) {
        if (!(error instanceof IdempotencyReservationError)) throw error;
        const replay = await this.replayedMajorEditNotification(idempotencyDigest, fingerprint, notificationKey, user);
        if (!replay) throw error.original;
        const delivered = await this.deliverMajorEditNotificationEvent(replay.event, notificationKey, user);
        return agentSuccess(majorEditNotificationSummary(delivered), { requestId, meta: { idempotencyKey: input.idempotencyKey, objectId: String(replay.stored.articleId), readAfterWrite: true, revision: replay.stored.revision } });
      }
      if ("kind" in outcome) throw new AgentServiceError("REVISION_CONFLICT", "The Article changed after this notification was prepared.", { latestRevision: outcome.revision });
      const delivered = await this.deliverMajorEditNotificationEvent(outcome.event, notificationKey, user);
      return agentSuccess(majorEditNotificationSummary(delivered), { requestId, meta: { auditId: outcome.auditId, idempotencyKey: input.idempotencyKey, objectId: String(outcome.articleId), readAfterWrite: true, revision: outcome.revision } });
    } catch (error) {
      if (!(error instanceof AgentServiceError && ["IDEMPOTENCY_CONFLICT", "REVISION_CONFLICT"].includes(error.code))) {
        const failureRequestId = auditedFailureRequestId(requestId, error);
        await this.auditAttempt({ objectId: confirmation ? String(confirmation.articleId) : undefined, objectType: "article", requestId: failureRequestId, result: "failed", tool: "editorial_commit_major_edit_notification" });
        return failure(error, failureRequestId);
      }
      return failure(error, requestId);
    }
  }

  private headingLevelWarnings(article: Article): AgentPreviewWarning[] {
    const warnings: AgentPreviewWarning[] = [];
    const root = (article.body as { root?: { children?: unknown } } | null)?.root;
    const children = Array.isArray(root?.children) ? root.children : [];
    // The article title renders as h1, so the first body heading may be at
    // most h2 and every later heading may go at most one level deeper.
    let previousLevel = 1;
    children.forEach((node, index) => {
      if (!node || typeof node !== "object" || (node as { type?: unknown }).type !== "heading") return;
      const tag = String((node as { tag?: unknown }).tag ?? "");
      if (!/^h[1-6]$/.test(tag)) return;
      const level = Number(tag.slice(1));
      if (level > previousLevel + 1) {
        warnings.push({
          code: "heading_level_jump",
          message: `Heading level jumps from h${previousLevel} to h${level}.`,
          details: { blockIndex: index, from: previousLevel, to: level },
        });
      }
      previousLevel = level;
    });
    return warnings;
  }

  private async previewWarnings(article: Article, user: User) {
    const warnings: AgentPreviewWarning[] = [];
    if (!articleRelationID(article.coverImage)) {
      warnings.push({ code: "missing_cover", message: "The article has no cover image." });
    }
    if (!article.summary?.trim()) {
      warnings.push({ code: "missing_summary", message: "The article has no summary." });
    }
    warnings.push(...this.headingLevelWarnings(article));
    const policyReq = await createLocalReq({ user }, this.payload);
    for (const mediaId of collectRichTextUploadMediaIDs(article.body)) {
      try {
        await assertMediaAllowedForMemberPublication(mediaId, policyReq, "Body image");
      } catch (error) {
        if (!(error instanceof APIError)) throw error;
        warnings.push({
          code: "body_media_ownership",
          message: "A body image is not media the current member may publish.",
          details: { mediaId },
        });
      }
    }
    return warnings;
  }

  async preview(id: number) {
    const requestId = createAgentRequestId();
    try {
      const user = await this.currentUser();
      const article = await this.ownedArticle(id, user);
      const warnings = await this.previewWarnings(article, user);
      await this.auditAttempt({ objectId: String(article.id), objectType: "article", requestId, result: "success", tool: "article_preview" });
      return agentSuccess({ path: `/${article.locale}/posts/${article.slug}?preview=${encodeURIComponent(String(article.id))}`, expiresAt: null, warnings }, { requestId, meta: { objectId: String(article.id), revision: revision(article) } });
    } catch (error) {
      await this.auditReadFailure("article_preview", requestId, error, String(id));
      return failure(error, requestId);
    }
  }
}
