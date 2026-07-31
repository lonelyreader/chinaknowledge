import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import config from "@payload-config";
import { OAuthError, type AuthInfo, type OAuthTokenVerifier } from "@modelcontextprotocol/server";
import { getPayload } from "payload";

import type { AgentConnection, AgentOauthClient, Person, User } from "@/payload-types";

import { agentUrls } from "./metadata";

function relationId(value: number | { id: number } | null | undefined) {
  return typeof value === "number" ? value : value?.id;
}

export function digestAgentSecret(value: string, secret: string) {
  return createHmac("sha256", secret).update(value, "utf8").digest("base64url");
}

export function createAgentRefreshToken(tokenFamily: string, secret: string) {
  const nonce = randomBytes(32).toString("base64url");
  const body = `rt1.${tokenFamily}.${nonce}`;
  return `${body}.${digestAgentSecret(body, secret)}`;
}

export function agentRefreshTokenFamily(token: string, secret: string) {
  const parts = token.split(".");
  if (
    parts.length !== 4
    || parts[0] !== "rt1"
    || !/^[A-Za-z0-9_-]{1,128}$/.test(parts[1] ?? "")
    || !/^[A-Za-z0-9_-]{43}$/.test(parts[2] ?? "")
    || !/^[A-Za-z0-9_-]{43}$/.test(parts[3] ?? "")
  ) return null;
  const body = parts.slice(0, 3).join(".");
  const supplied = Buffer.from(parts[3]!, "base64url");
  const expected = Buffer.from(digestAgentSecret(body, secret), "base64url");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
    ? parts[1]!
    : null;
}

function invalidToken() {
  return new OAuthError("invalid_token", "The access token is invalid or unavailable.");
}

export function createPayloadAgentTokenVerifier(
  origin: string | URL,
  secret = process.env.PAYLOAD_SECRET,
): OAuthTokenVerifier {
  const resource = agentUrls(origin).resource;
  return {
    async verifyAccessToken(token): Promise<AuthInfo> {
      if (!secret) throw invalidToken();
      const payload = await getPayload({ config });
      const now = new Date();
      const result = await payload.find({
        collection: "agent-connections",
        depth: 1,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            { accessTokenDigest: { equals: digestAgentSecret(token, secret) } },
            { state: { equals: "active" } },
            { accessExpiresAt: { greater_than: now.toISOString() } },
            { resource: { equals: resource.href } },
          ],
        },
      });
      const connection = result.docs[0] as AgentConnection | undefined;
      if (!connection?.accessExpiresAt) throw invalidToken();

      const userId = relationId(connection.user as number | User);
      const personId = relationId(connection.person as number | Person | null);
      const client = connection.client as number | AgentOauthClient;
      const clientId = typeof client === "number" ? null : client.clientId;
      if (!userId || !personId || !clientId || (typeof client !== "number" && client.disabled)) {
        throw invalidToken();
      }

      const user = await payload.findByID({
        collection: "users",
        id: userId,
        depth: 0,
        overrideAccess: true,
      });
      if (user.accountStatus === "paused") throw invalidToken();

      const people = await payload.find({
        collection: "people",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: { and: [{ id: { equals: personId } }, { user: { equals: userId } }] },
      });
      if (!people.docs[0]) throw invalidToken();

      const lastUsedAt = connection.lastUsedAt ? new Date(connection.lastUsedAt).getTime() : 0;
      if (lastUsedAt < now.getTime() - 60_000) {
        await payload.update({
          collection: "agent-connections",
          id: connection.id,
          overrideAccess: true,
          data: { lastUsedAt: now.toISOString() },
        });
      }

      return {
        token,
        clientId,
        scopes: connection.scopes,
        expiresAt: Math.floor(new Date(connection.accessExpiresAt).getTime() / 1000),
        resource,
        extra: {
          clientFamily: typeof client === "number" ? "unknown" : client.clientFamily,
          connectionId: connection.id,
          personId,
          role: user.role,
          userId,
        },
      };
    },
  };
}
