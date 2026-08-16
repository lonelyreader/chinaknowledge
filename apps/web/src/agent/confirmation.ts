import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type PublicationConfirmationPayload = {
  action: "publish" | "republish" | "update_public" | "withdraw";
  articleId: number;
  connectionId: number;
  exp: number;
  jti: string;
  personId: number;
  revision: string;
  targetStatus: "published" | "withdrawn";
  userId: number;
  v: 1;
};

export type SiteSelectionConfirmationPayload = {
  action: "add_to_site" | "remove_from_site";
  articleId: number;
  connectionId: number;
  exp: number;
  jti: string;
  personId: number;
  revision: string;
  targetStatus: "curated" | "removed";
  userId: number;
  v: 1;
};

export type ProfilePublicationConfirmationPayload = {
  action: "publish" | "withdraw";
  connectionId: number;
  exp: number;
  jti: string;
  personId: number;
  revision: string;
  role: "author" | "editor" | "super_admin";
  targetStatus: "draft" | "public";
  userId: number;
  v: 1;
};

export type HomepageScheduleConfirmationPayload = {
  articleId: number;
  connectionId: number;
  endsAt: string | null;
  exp: number;
  jti: string;
  personId: number;
  placement: "lead" | "none" | "selected";
  previousEndsAt: string | null;
  previousPlacement: "lead" | "none" | "selected" | null;
  previousStartsAt: string | null;
  revision: string;
  role: "editor" | "super_admin";
  startsAt: string | null;
  userId: number;
  v: 1;
};

export type MajorEditNotificationConfirmationPayload = {
  action: "major_edit";
  articleId: number;
  connectionId: number;
  exp: number;
  jti: string;
  ownerId: number;
  personId: number;
  recipientDigest: string;
  revision: string;
  role: "editor" | "super_admin";
  userId: number;
  v: 1;
};

export class PublicationConfirmationError extends Error {
  constructor(readonly reason: "expired" | "invalid", message: string) {
    super(message);
  }
}

function publicationSecret(value = process.env.PAYLOAD_SECRET) {
  if (!value || value.length < 32) {
    throw new PublicationConfirmationError("invalid", "The publication confirmation service is unavailable.");
  }
  return value;
}

function signature(encoded: string, secret: string) {
  return createHmac("sha256", secret).update(`agent-publication\0${encoded}`).digest("base64url");
}

function siteSelectionSignature(encoded: string, secret: string) {
  return createHmac("sha256", secret).update(`agent-site-selection\0${encoded}`).digest("base64url");
}

function profilePublicationSignature(encoded: string, secret: string) {
  return createHmac("sha256", secret).update(`agent-profile-publication\0${encoded}`).digest("base64url");
}

function editorActionSignature(domain: "homepage-schedule" | "major-edit-notification", encoded: string, secret: string) {
  return createHmac("sha256", secret).update(`agent-${domain}\0${encoded}`).digest("base64url");
}

function validConfirmationBase(payload: {
  articleId?: number;
  connectionId?: number;
  exp?: number;
  jti?: string;
  personId?: number;
  revision?: string;
  userId?: number;
  v?: number;
}) {
  return payload.v === 1
    && Number.isInteger(payload.articleId) && Number(payload.articleId) > 0
    && Number.isInteger(payload.connectionId) && Number(payload.connectionId) > 0
    && Number.isInteger(payload.personId) && Number(payload.personId) > 0
    && Number.isInteger(payload.userId) && Number(payload.userId) > 0
    && typeof payload.exp === "number" && Number.isFinite(payload.exp)
    && typeof payload.jti === "string" && /^[0-9a-f-]{36}$/.test(payload.jti)
    && typeof payload.revision === "string" && /^rev1_[A-Za-z0-9_-]{43}$/.test(payload.revision);
}

function validRFC3339(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(new Date(value).getTime());
}

function validHomepageSchedulePayload(value: unknown): value is HomepageScheduleConfirmationPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<HomepageScheduleConfirmationPayload>;
  const validTarget = payload.placement === "none"
    ? payload.startsAt === null && payload.endsAt === null
    : (payload.placement === "lead" || payload.placement === "selected")
      && validRFC3339(payload.startsAt) && validRFC3339(payload.endsAt);
  return validConfirmationBase(payload)
    && validTarget
    && (payload.role === "editor" || payload.role === "super_admin")
    && (payload.previousPlacement == null || payload.previousPlacement === "none" || payload.previousPlacement === "lead" || payload.previousPlacement === "selected")
    && (payload.previousStartsAt == null || validRFC3339(payload.previousStartsAt))
    && (payload.previousEndsAt == null || validRFC3339(payload.previousEndsAt));
}

function validMajorEditNotificationPayload(value: unknown): value is MajorEditNotificationConfirmationPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<MajorEditNotificationConfirmationPayload>;
  return validConfirmationBase(payload)
    && payload.action === "major_edit"
    && (payload.role === "editor" || payload.role === "super_admin")
    && Number.isInteger(payload.ownerId) && Number(payload.ownerId) > 0
    && typeof payload.recipientDigest === "string"
    && /^recipient_[A-Za-z0-9_-]{43}$/.test(payload.recipientDigest);
}

function createEditorActionConfirmation(
  prefix: "cifh1" | "cifn1",
  domain: "homepage-schedule" | "major-edit-notification",
  payload: HomepageScheduleConfirmationPayload | MajorEditNotificationConfirmationPayload,
  secret: string,
) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${prefix}.${encoded}.${editorActionSignature(domain, encoded, publicationSecret(secret))}`;
}

function readEditorActionConfirmation<T>(
  token: string,
  config: {
    domain: "homepage-schedule" | "major-edit-notification";
    invalidMessage: string;
    prefix: "cifh1" | "cifn1";
    valid: (value: unknown) => value is T;
  },
  options: { allowExpired?: boolean; now?: number; secret?: string } = {},
) {
  if (typeof token !== "string" || token.length > 2_048) {
    throw new PublicationConfirmationError("invalid", config.invalidMessage);
  }
  const [version, encoded, provided, ...rest] = token.split(".");
  if (version !== config.prefix || !encoded || !provided || rest.length) {
    throw new PublicationConfirmationError("invalid", config.invalidMessage);
  }
  const expected = editorActionSignature(config.domain, encoded, publicationSecret(options.secret));
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
    throw new PublicationConfirmationError("invalid", config.invalidMessage);
  }
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new PublicationConfirmationError("invalid", config.invalidMessage);
  }
  if (!config.valid(payload)) throw new PublicationConfirmationError("invalid", config.invalidMessage);
  if (!options.allowExpired && (payload as { exp: number }).exp < (options.now ?? Date.now())) {
    throw new PublicationConfirmationError("expired", `${config.invalidMessage.replace(" is invalid.", "")} expired. Prepare the action again.`);
  }
  return payload;
}

function validPayload(value: unknown): value is PublicationConfirmationPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<PublicationConfirmationPayload>;
  return payload.v === 1
    && Number.isInteger(payload.articleId) && Number(payload.articleId) > 0
    && Number.isInteger(payload.connectionId) && Number(payload.connectionId) > 0
    && Number.isInteger(payload.personId) && Number(payload.personId) > 0
    && Number.isInteger(payload.userId) && Number(payload.userId) > 0
    && (payload.action === "publish" || payload.action === "republish" || payload.action === "update_public" || payload.action === "withdraw")
    && typeof payload.exp === "number" && Number.isFinite(payload.exp)
    && typeof payload.jti === "string" && /^[0-9a-f-]{36}$/.test(payload.jti)
    && typeof payload.revision === "string" && /^rev1_[A-Za-z0-9_-]{43}$/.test(payload.revision)
    && (payload.targetStatus === "published" || payload.targetStatus === "withdrawn");
}

function validSiteSelectionPayload(value: unknown): value is SiteSelectionConfirmationPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<SiteSelectionConfirmationPayload>;
  return payload.v === 1
    && Number.isInteger(payload.articleId) && Number(payload.articleId) > 0
    && Number.isInteger(payload.connectionId) && Number(payload.connectionId) > 0
    && Number.isInteger(payload.personId) && Number(payload.personId) > 0
    && Number.isInteger(payload.userId) && Number(payload.userId) > 0
    && (payload.action === "add_to_site" || payload.action === "remove_from_site")
    && typeof payload.exp === "number" && Number.isFinite(payload.exp)
    && typeof payload.jti === "string" && /^[0-9a-f-]{36}$/.test(payload.jti)
    && typeof payload.revision === "string" && /^rev1_[A-Za-z0-9_-]{43}$/.test(payload.revision)
    && (payload.targetStatus === "curated" || payload.targetStatus === "removed");
}

function validProfilePublicationPayload(value: unknown): value is ProfilePublicationConfirmationPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<ProfilePublicationConfirmationPayload>;
  return payload.v === 1
    && Number.isInteger(payload.connectionId) && Number(payload.connectionId) > 0
    && Number.isInteger(payload.personId) && Number(payload.personId) > 0
    && Number.isInteger(payload.userId) && Number(payload.userId) > 0
    && (payload.action === "publish" || payload.action === "withdraw")
    && typeof payload.exp === "number" && Number.isFinite(payload.exp)
    && typeof payload.jti === "string" && /^[0-9a-f-]{36}$/.test(payload.jti)
    && typeof payload.revision === "string" && /^rev1_[A-Za-z0-9_-]{43}$/.test(payload.revision)
    && (payload.role === "author" || payload.role === "editor" || payload.role === "super_admin")
    && (payload.targetStatus === "draft" || payload.targetStatus === "public");
}

export function createPublicationConfirmation(
  payload: PublicationConfirmationPayload,
  secret = publicationSecret(),
) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `cifc1.${encoded}.${signature(encoded, publicationSecret(secret))}`;
}

export function readPublicationConfirmation(
  token: string,
  options: { allowExpired?: boolean; now?: number; secret?: string } = {},
) {
  if (typeof token !== "string" || token.length > 2_048) {
    throw new PublicationConfirmationError("invalid", "The publication confirmation is invalid.");
  }
  const [version, encoded, provided, ...rest] = token.split(".");
  if (version !== "cifc1" || !encoded || !provided || rest.length) {
    throw new PublicationConfirmationError("invalid", "The publication confirmation is invalid.");
  }
  const expected = signature(encoded, publicationSecret(options.secret));
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
    throw new PublicationConfirmationError("invalid", "The publication confirmation is invalid.");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new PublicationConfirmationError("invalid", "The publication confirmation is invalid.");
  }
  if (!validPayload(payload)) {
    throw new PublicationConfirmationError("invalid", "The publication confirmation is invalid.");
  }
  if (!options.allowExpired && payload.exp < (options.now ?? Date.now())) {
    throw new PublicationConfirmationError("expired", "The publication confirmation expired. Prepare the action again.");
  }
  return payload;
}

export function publicationConfirmationDigest(token: string) {
  return `confirm_${createHash("sha256").update(token).digest("base64url")}`;
}

export function createSiteSelectionConfirmation(
  payload: SiteSelectionConfirmationPayload,
  secret = publicationSecret(),
) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `cifs1.${encoded}.${siteSelectionSignature(encoded, publicationSecret(secret))}`;
}

export function readSiteSelectionConfirmation(
  token: string,
  options: { allowExpired?: boolean; now?: number; secret?: string } = {},
) {
  if (typeof token !== "string" || token.length > 2_048) {
    throw new PublicationConfirmationError("invalid", "The site selection confirmation is invalid.");
  }
  const [version, encoded, provided, ...rest] = token.split(".");
  if (version !== "cifs1" || !encoded || !provided || rest.length) {
    throw new PublicationConfirmationError("invalid", "The site selection confirmation is invalid.");
  }
  const expected = siteSelectionSignature(encoded, publicationSecret(options.secret));
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
    throw new PublicationConfirmationError("invalid", "The site selection confirmation is invalid.");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new PublicationConfirmationError("invalid", "The site selection confirmation is invalid.");
  }
  if (!validSiteSelectionPayload(payload)) {
    throw new PublicationConfirmationError("invalid", "The site selection confirmation is invalid.");
  }
  if (!options.allowExpired && payload.exp < (options.now ?? Date.now())) {
    throw new PublicationConfirmationError("expired", "The site selection confirmation expired. Prepare the action again.");
  }
  return payload;
}

export function siteSelectionConfirmationDigest(token: string) {
  return `site_confirm_${createHash("sha256").update(token).digest("base64url")}`;
}

export function createProfilePublicationConfirmation(
  payload: ProfilePublicationConfirmationPayload,
  secret = publicationSecret(),
) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `cifp1.${encoded}.${profilePublicationSignature(encoded, publicationSecret(secret))}`;
}

export function readProfilePublicationConfirmation(
  token: string,
  options: { allowExpired?: boolean; now?: number; secret?: string } = {},
) {
  if (typeof token !== "string" || token.length > 2_048) {
    throw new PublicationConfirmationError("invalid", "The profile publication confirmation is invalid.");
  }
  const [version, encoded, provided, ...rest] = token.split(".");
  if (version !== "cifp1" || !encoded || !provided || rest.length) {
    throw new PublicationConfirmationError("invalid", "The profile publication confirmation is invalid.");
  }
  const expected = profilePublicationSignature(encoded, publicationSecret(options.secret));
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) {
    throw new PublicationConfirmationError("invalid", "The profile publication confirmation is invalid.");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new PublicationConfirmationError("invalid", "The profile publication confirmation is invalid.");
  }
  if (!validProfilePublicationPayload(payload)) {
    throw new PublicationConfirmationError("invalid", "The profile publication confirmation is invalid.");
  }
  if (!options.allowExpired && payload.exp < (options.now ?? Date.now())) {
    throw new PublicationConfirmationError("expired", "The profile publication confirmation expired. Prepare the action again.");
  }
  return payload;
}

export function profilePublicationConfirmationDigest(token: string) {
  return `profile_confirm_${createHash("sha256").update(token).digest("base64url")}`;
}

export function createHomepageScheduleConfirmation(
  payload: HomepageScheduleConfirmationPayload,
  secret = publicationSecret(),
) {
  return createEditorActionConfirmation("cifh1", "homepage-schedule", payload, secret);
}

export function readHomepageScheduleConfirmation(
  token: string,
  options: { allowExpired?: boolean; now?: number; secret?: string } = {},
) {
  return readEditorActionConfirmation(token, {
    domain: "homepage-schedule",
    invalidMessage: "The homepage schedule confirmation is invalid.",
    prefix: "cifh1",
    valid: validHomepageSchedulePayload,
  }, options);
}

export function homepageScheduleConfirmationDigest(token: string) {
  return `homepage_confirm_${createHash("sha256").update(token).digest("base64url")}`;
}

export function createMajorEditNotificationConfirmation(
  payload: MajorEditNotificationConfirmationPayload,
  secret = publicationSecret(),
) {
  return createEditorActionConfirmation("cifn1", "major-edit-notification", payload, secret);
}

export function readMajorEditNotificationConfirmation(
  token: string,
  options: { allowExpired?: boolean; now?: number; secret?: string } = {},
) {
  return readEditorActionConfirmation(token, {
    domain: "major-edit-notification",
    invalidMessage: "The major-edit notification confirmation is invalid.",
    prefix: "cifn1",
    valid: validMajorEditNotificationPayload,
  }, options);
}

export function majorEditNotificationConfirmationDigest(token: string) {
  return `notification_confirm_${createHash("sha256").update(token).digest("base64url")}`;
}

export function majorEditRecipientDigest(recipient: string, secret = publicationSecret()) {
  const digest = createHmac("sha256", secret)
    .update(`agent-major-edit-recipient\0${recipient.trim().toLowerCase()}`)
    .digest("base64url");
  return `recipient_${digest}`;
}
