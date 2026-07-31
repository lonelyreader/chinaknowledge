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
