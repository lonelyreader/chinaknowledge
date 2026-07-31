import { randomBytes, randomUUID } from "node:crypto";

import OAuth2Server from "@node-oauth/oauth2-server";
import type { Payload, Where } from "payload";

import type { AgentConnection, AgentOauthClient, Person, User } from "@/payload-types";

import {
  agentRefreshTokenFamily,
  createAgentRefreshToken,
  digestAgentSecret,
} from "./tokens";

type OAuthUser = OAuth2Server.User & {
  authorizationClaimDigest?: string;
  connectionId?: number;
  personId: number;
  refreshClaimDigest?: string;
  resource: string;
  userId: number;
};

type OAuthClient = OAuth2Server.Client & {
  payloadId: number;
};

function idOf(value: number | { id: number } | null | undefined) {
  return typeof value === "number" ? value : value?.id;
}

function tokenValue() {
  return randomBytes(32).toString("base64url");
}

function asClient(client: AgentOauthClient): OAuthClient {
  return {
    id: client.clientId,
    payloadId: client.id,
    grants: client.grantTypes,
    redirectUris: client.redirectUris.map(({ uri }) => uri),
  };
}

async function hydratedUser(payload: Payload, connection: AgentConnection): Promise<OAuthUser | null> {
  const userId = idOf(connection.user as number | User);
  const personId = idOf(connection.person as number | Person | null);
  if (!userId || !personId) return null;
  const user = await payload.findByID({
    collection: "users",
    id: userId,
    depth: 0,
    overrideAccess: true,
  });
  if (user.accountStatus === "paused") return null;
  const people = await payload.find({
    collection: "people",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { and: [{ id: { equals: personId } }, { user: { equals: userId } }] },
  });
  if (!people.docs[0]) return null;
  return { connectionId: connection.id, personId, resource: connection.resource, userId };
}

export function createAgentOAuthModel(payload: Payload, secret: string, resource: string) {
  const model: OAuth2Server.AuthorizationCodeModel & OAuth2Server.RefreshTokenModel = {
    async generateAccessToken() {
      return tokenValue();
    },
    async generateAuthorizationCode() {
      return tokenValue();
    },
    async generateRefreshToken() {
      return tokenValue();
    },
    async getClient(clientId) {
      const result = await payload.find({
        collection: "agent-oauth-clients",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            { clientId: { equals: clientId } },
            { disabled: { equals: false } },
            { or: [{ expiresAt: { greater_than: new Date().toISOString() } }, { expiresAt: { exists: false } }] },
          ],
        },
      });
      return result.docs[0] ? asClient(result.docs[0]) : null;
    },
    async getAuthorizationCode(authorizationCode) {
      const authorizationClaimDigest = digestAgentSecret(authorizationCode, secret);
      const result = await payload.find({
        collection: "agent-connections",
        depth: 1,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            { authorizationCodeDigest: { equals: authorizationClaimDigest } },
            { state: { equals: "active" } },
            { codeConsumedAt: { exists: false } },
            { codeExpiresAt: { greater_than: new Date().toISOString() } },
            { resource: { equals: resource } },
          ],
        },
      });
      const candidate = result.docs[0];
      if (!candidate?.codeExpiresAt || !candidate.authorizationRedirectUri) return null;
      const claimed = await payload.update({
        collection: "agent-connections",
        limit: 1,
        overrideAccess: true,
        showHiddenFields: true,
        where: {
          and: [
            { id: { equals: candidate.id } },
            { authorizationCodeDigest: { equals: authorizationClaimDigest } },
            { state: { equals: "active" } },
            { codeConsumedAt: { exists: false } },
            { codeExpiresAt: { greater_than: new Date().toISOString() } },
            { resource: { equals: resource } },
          ],
        },
        data: { codeConsumedAt: new Date().toISOString() },
      });
      const connection = claimed.docs[0];
      if (!connection?.codeExpiresAt || !connection.authorizationRedirectUri) return null;
      const user = await hydratedUser(payload, connection);
      const clientId = idOf(connection.client as number | AgentOauthClient);
      if (!user || !clientId) return null;
      const client = await payload.findByID({
        collection: "agent-oauth-clients",
        id: clientId,
        depth: 0,
        overrideAccess: true,
      });
      return {
        authorizationCode,
        expiresAt: new Date(connection.codeExpiresAt),
        redirectUri: connection.authorizationRedirectUri,
        scope: connection.scopes,
        client: asClient(client),
        user: { ...user, authorizationClaimDigest },
        codeChallenge: connection.codeChallenge ?? undefined,
        codeChallengeMethod: "S256",
      };
    },
    async getAccessToken(accessToken) {
      const result = await payload.find({
        collection: "agent-connections",
        depth: 1,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            { accessTokenDigest: { equals: digestAgentSecret(accessToken, secret) } },
            { state: { equals: "active" } },
            { accessExpiresAt: { greater_than: new Date().toISOString() } },
            { resource: { equals: resource } },
          ],
        },
      });
      const connection = result.docs[0];
      if (!connection?.accessExpiresAt) return null;
      const user = await hydratedUser(payload, connection);
      const clientId = idOf(connection.client as number | AgentOauthClient);
      if (!user || !clientId) return null;
      const client = await payload.findByID({ collection: "agent-oauth-clients", id: clientId, depth: 0, overrideAccess: true });
      return { accessToken, accessTokenExpiresAt: new Date(connection.accessExpiresAt), scope: connection.scopes, client: asClient(client), user };
    },
    async getRefreshToken(refreshToken) {
      const digest = digestAgentSecret(refreshToken, secret);
      const tokenFamily = agentRefreshTokenFamily(refreshToken, secret);
      if (!tokenFamily) return null;
      const result = await payload.find({
        collection: "agent-connections",
        depth: 1,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        showHiddenFields: true,
        where: { tokenFamily: { equals: tokenFamily } },
      });
      const candidate = result.docs[0];
      if (!candidate) return null;
      if (candidate.state !== "active" || !candidate.refreshExpiresAt || new Date(candidate.refreshExpiresAt) <= new Date()) return null;
      if (candidate.refreshTokenDigest !== digest) {
        await payload.update({
          collection: "agent-connections",
          id: candidate.id,
          overrideAccess: true,
          data: { state: "compromised", revokedAt: new Date().toISOString() },
        });
        return null;
      }
      const claimed = await payload.update({
        collection: "agent-connections",
        limit: 1,
        overrideAccess: true,
        showHiddenFields: true,
        where: {
          and: [
            { id: { equals: candidate.id } },
            { refreshTokenDigest: { equals: digest } },
            { state: { equals: "active" } },
            { refreshExpiresAt: { greater_than: new Date().toISOString() } },
          ],
        },
        data: { previousRefreshTokenDigest: digest, refreshTokenDigest: null },
      });
      const connection = claimed.docs[0];
      if (!connection?.refreshExpiresAt) return null;
      const user = await hydratedUser(payload, connection);
      const clientId = idOf(connection.client as number | AgentOauthClient);
      if (!user || !clientId) return null;
      const client = await payload.findByID({ collection: "agent-oauth-clients", id: clientId, depth: 0, overrideAccess: true });
      return { refreshToken, refreshTokenExpiresAt: new Date(connection.refreshExpiresAt), scope: connection.scopes, client: asClient(client), user: { ...user, refreshClaimDigest: digest } };
    },
    async revokeAuthorizationCode() {
      return true;
    },
    async revokeToken() {
      return true;
    },
    async saveAuthorizationCode(code, client, user) {
      const oauthUser = user as OAuthUser;
      const oauthClient = client as OAuthClient;
      const connection = await payload.create({
        collection: "agent-connections",
        overrideAccess: true,
        data: {
          user: oauthUser.userId,
          person: oauthUser.personId,
          client: oauthClient.payloadId,
          scopes: (code.scope ?? ["agent:member"]) as ("agent:member" | "offline_access")[],
          resource: oauthUser.resource,
          tokenFamily: randomUUID(),
          state: "active",
          authorizationCodeDigest: digestAgentSecret(code.authorizationCode, secret),
          codeChallenge: code.codeChallenge,
          authorizationRedirectUri: code.redirectUri,
          codeExpiresAt: code.expiresAt.toISOString(),
        },
      });
      return { ...code, client, user: { ...oauthUser, connectionId: connection.id } };
    },
    async saveToken(token, client, user) {
      const oauthUser = user as OAuthUser;
      const oauthClient = client as OAuthClient;
      if (!oauthUser.connectionId || !token.accessTokenExpiresAt) return null;
      const refreshClaimDigest = oauthUser.refreshClaimDigest;
      const authorizationClaimDigest = oauthUser.authorizationClaimDigest;
      if (!refreshClaimDigest && !authorizationClaimDigest) return null;
      const connection = await payload.findByID({
        collection: "agent-connections",
        id: oauthUser.connectionId,
        depth: 0,
        overrideAccess: true,
        showHiddenFields: true,
      });
      if (connection.state !== "active") return null;
      const refreshToken = token.refreshToken && connection.scopes.includes("offline_access")
        ? createAgentRefreshToken(connection.tokenFamily, secret)
        : undefined;
      const claim: Where[] = refreshClaimDigest
        ? [{ previousRefreshTokenDigest: { equals: refreshClaimDigest } }]
        : [
            { authorizationCodeDigest: { equals: authorizationClaimDigest! } },
            { codeConsumedAt: { exists: true } },
          ];
      const updated = await payload.update({
        collection: "agent-connections",
        limit: 1,
        overrideAccess: true,
        where: { and: [{ id: { equals: oauthUser.connectionId } }, { state: { equals: "active" } }, ...claim] },
        data: {
          ...(oauthUser.authorizationClaimDigest ? { authorizationCodeDigest: null } : {}),
          accessTokenDigest: digestAgentSecret(token.accessToken, secret),
          accessExpiresAt: token.accessTokenExpiresAt.toISOString(),
          ...(refreshClaimDigest ? { previousRefreshTokenDigest: null } : {}),
          refreshTokenDigest: refreshToken ? digestAgentSecret(refreshToken, secret) : null,
          refreshExpiresAt: refreshToken
            ? (token.refreshTokenExpiresAt?.toISOString() ?? null)
            : null,
          lastUsedAt: new Date().toISOString(),
        },
      });
      if (!updated.docs[0]) return null;
      await payload.update({
        collection: "agent-oauth-clients",
        id: oauthClient.payloadId,
        overrideAccess: true,
        data: { expiresAt: null, lastUsedAt: new Date().toISOString() },
      });
      return { ...token, refreshToken, client, user };
    },
    async validateRedirectUri(redirectUri, client) {
      const uris = Array.isArray(client.redirectUris) ? client.redirectUris : [client.redirectUris];
      return uris.includes(redirectUri);
    },
    async validateScope(_user, _client, scope = []) {
      const requested = scope.length ? scope : ["agent:member"];
      return requested.includes("agent:member") && requested.every((item) => item === "agent:member" || item === "offline_access")
        ? requested
        : false;
    },
    async verifyScope(token, scope) {
      return scope.every((item) => token.scope?.includes(item));
    },
  };
  return model;
}

export function createAgentOAuthServer(payload: Payload, secret: string, resource: string) {
  return new OAuth2Server({
    model: createAgentOAuthModel(payload, secret, resource),
    accessTokenLifetime: 10 * 60,
    authorizationCodeLifetime: 60,
    refreshTokenLifetime: 7 * 24 * 60 * 60,
    requireClientAuthentication: { authorization_code: false, refresh_token: false },
    alwaysIssueNewRefreshToken: true,
  });
}
