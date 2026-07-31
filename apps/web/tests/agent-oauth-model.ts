import assert from "node:assert/strict";

import type { Payload } from "payload";

import { createAgentOAuthModel } from "@/agent/oauth-model";
import {
  agentRefreshTokenFamily,
  createAgentRefreshToken,
  digestAgentSecret,
} from "@/agent/tokens";

const secret = "fixture-secret-with-at-least-32-chars";
const resource = "https://example.test/api/agent/mcp";
const future = new Date(Date.now() + 60_000).toISOString();
const connection = {
  id: 9,
  user: 5,
  person: 7,
  client: 3,
  scopes: ["agent:member", "offline_access"],
  resource,
  tokenFamily: "fixture-family",
  state: "active",
  refreshExpiresAt: future,
};
const client = {
  id: 3,
  clientId: "fixture-client",
  clientName: "Fixture",
  clientFamily: "fixture",
  redirectUris: [{ uri: "https://agent.example/callback" }],
  grantTypes: ["authorization_code", "refresh_token"],
  tokenEndpointAuthMethod: "none",
  disabled: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let codeAvailable = true;
let codeClaims = 0;
const codeConnection = {
  ...connection,
  authorizationCodeDigest: digestAgentSecret("single-use-code", secret),
  authorizationRedirectUri: "https://agent.example/callback",
  codeChallenge: "a".repeat(43),
  codeExpiresAt: future,
  codeConsumedAt: null,
};
const codePayload = {
  async find({ collection }: { collection: string }) {
    if (collection === "people") return { docs: [{ id: 7 }] };
    return { docs: codeAvailable ? [codeConnection] : [] };
  },
  async findByID({ collection }: { collection: string }) {
    return collection === "users" ? { id: 5, accountStatus: "active" } : client;
  },
  async update({ data }: { data: Record<string, unknown> }) {
    if (!codeAvailable) return { docs: [] };
    codeAvailable = false;
    codeClaims += 1;
    return { docs: [{ ...codeConnection, ...data }] };
  },
} as unknown as Payload;
const codeModel = createAgentOAuthModel(codePayload, secret, resource);
assert.ok(await codeModel.getAuthorizationCode("single-use-code"));
assert.equal(await codeModel.getAuthorizationCode("single-use-code"), null);
assert.equal(codeClaims, 1);

let compromised = false;
const usedRefresh = createAgentRefreshToken(connection.tokenFamily, secret);
const replayPayload = {
  async find() {
    return {
      docs: [{
        ...connection,
        refreshTokenDigest: digestAgentSecret(
          createAgentRefreshToken(connection.tokenFamily, secret),
          secret,
        ),
      }],
    };
  },
  async update() {
    compromised = true;
  },
} as unknown as Payload;
const replayModel = createAgentOAuthModel(replayPayload, secret, resource);
assert.equal(await replayModel.getRefreshToken(usedRefresh), null);
assert.equal(compromised, true);
assert.equal(agentRefreshTokenFamily(`${usedRefresh}x`, secret), null);

const currentRefresh = createAgentRefreshToken(connection.tokenFamily, secret);
function identityPayload(input: { paused?: boolean; person?: boolean }) {
  return {
    async find({ collection }: { collection: string }) {
      if (collection === "agent-connections") {
        return {
          docs: [{
            ...connection,
            refreshTokenDigest: digestAgentSecret(currentRefresh, secret),
          }],
        };
      }
      return { docs: input.person === false ? [] : [{ id: 7 }] };
    },
    async findByID({ collection }: { collection: string }) {
      if (collection === "users") return { id: 5, accountStatus: input.paused ? "paused" : "active" };
      return client;
    },
    async update({ collection: collectionName, data }: { collection: string; data: Record<string, unknown> }) {
      return {
        docs: collectionName === "agent-connections"
          ? [{ ...connection, ...data }]
          : [],
      };
    },
  } as unknown as Payload;
}
assert.equal(await createAgentOAuthModel(identityPayload({ paused: true }), secret, resource).getRefreshToken(currentRefresh), null);
assert.equal(await createAgentOAuthModel(identityPayload({ person: false }), secret, resource).getRefreshToken(currentRefresh), null);

const updates: Array<{ collection: string; data: Record<string, unknown> }> = [];
let refreshClaimMatched = false;
const rotatePayload = {
  async findByID({ collection }: { collection: string }) {
    if (collection === "agent-connections") return { ...connection, refreshTokenDigest: "old-digest" };
    return client;
  },
  async update({ collection: collectionName, data, where }: { collection: string; data: Record<string, unknown>; where?: Record<string, unknown> }) {
    updates.push({ collection: collectionName, data });
    if (collectionName === "agent-connections") refreshClaimMatched = JSON.stringify(where).includes("old-digest");
    return { docs: collectionName === "agent-connections" ? [connection] : [] };
  },
} as unknown as Payload;
const rotateModel = createAgentOAuthModel(rotatePayload, secret, resource);
const oauthUser = { connectionId: 9, personId: 7, refreshClaimDigest: "old-digest", resource, userId: 5 };
const oauthClient = { id: "fixture-client", payloadId: 3, grants: ["authorization_code", "refresh_token"], redirectUris: ["https://agent.example/callback"] };
const rotatedToken = await rotateModel.saveToken({
  accessToken: "new-access",
  accessTokenExpiresAt: new Date(Date.now() + 60_000),
  refreshToken: "new-refresh",
  refreshTokenExpiresAt: new Date(Date.now() + 120_000),
  client: oauthClient,
  user: oauthUser,
}, oauthClient, oauthUser);
assert.ok(rotatedToken);
assert.ok(rotatedToken?.refreshToken);
assert.equal(agentRefreshTokenFamily(rotatedToken!.refreshToken!, secret), connection.tokenFamily);
assert.equal(rotatedToken?.client, oauthClient);
assert.equal(rotatedToken?.user, oauthUser);
const connectionUpdate = updates.find((update) => update.collection === "agent-connections");
assert.equal(refreshClaimMatched, true);
assert.equal(connectionUpdate?.data.refreshTokenDigest, digestAgentSecret(rotatedToken!.refreshToken!, secret));
assert.equal(connectionUpdate?.data.previousRefreshTokenDigest, null);
assert.notEqual(connectionUpdate?.data.accessTokenDigest, "new-access");
assert.equal(updates.find((update) => update.collection === "agent-oauth-clients")?.data.expiresAt, null);

console.log("Agent OAuth model tests PASS.");
