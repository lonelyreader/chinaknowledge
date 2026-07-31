import assert from "node:assert/strict";

import { McpServer, OAuthError, type OAuthTokenVerifier } from "@modelcontextprotocol/server";
import type { Payload } from "payload";

import { handleAgentAccessGet, handleAgentAccessPost } from "@/agent/access-route";
import { createAgentGateway } from "@/agent/gateway";
import {
  agentUrls,
  buildAgentAuthorizationServerMetadata,
  buildAgentProtectedResourceMetadata,
} from "@/agent/metadata";
import {
  handleAuthorizeGet,
  handleAuthorizePost,
  handleRevokePost,
  handleTokenPost,
  authorizeActorHeaders,
  validRedirectUri,
  validAuthorizePostOrigin,
  validateAuthorizeRequest,
} from "@/agent/oauth-http";
import { handleRegistrationPost } from "@/agent/registration";
import { digestAgentSecret } from "@/agent/tokens";

const origin = "http://localhost:3000";
const urls = agentUrls(origin);
const now = Math.floor(Date.now() / 1000);
const verifier: OAuthTokenVerifier = {
  async verifyAccessToken(token) {
    if (token !== "fixture-token") throw new OAuthError("invalid_token", "Invalid fixture token.");
    return {
      token,
      clientId: "fixture-client",
      scopes: ["agent:member"],
      expiresAt: now + 300,
      resource: urls.resource,
      extra: { personId: 7, role: "author", userId: 5 },
    };
  },
};
const gateway = createAgentGateway({
  origin,
  verifier,
  serverFactory: () => new McpServer({ name: "china-in-fact", version: "0.1.0" }),
});

function mcpRequest(token?: string, resource = urls.resource.href) {
  const headers = new Headers({
    accept: "application/json, text/event-stream",
    "content-type": "application/json",
    host: urls.resource.host,
  });
  if (token) headers.set("authorization", `Bearer ${token}`);
  return new Request(resource, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "fixture", version: "1.0.0" },
      },
    }),
  });
}

const authorization = buildAgentAuthorizationServerMetadata(origin);
assert.equal(authorization.issuer, "http://localhost:3000/api/agent/oauth");
assert.deepEqual(authorization.code_challenge_methods_supported, ["S256"]);

const resource = buildAgentProtectedResourceMetadata(origin);
assert.equal(resource.resource, urls.resource.href);
assert.deepEqual(resource.authorization_servers, [authorization.issuer]);

const authorize = new URLSearchParams({
  client_id: "fixture-client",
  code_challenge: "a".repeat(43),
  code_challenge_method: "S256",
  redirect_uri: "http://127.0.0.1:54321/callback",
  resource: urls.resource.href,
  response_type: "code",
  scope: "agent:member offline_access",
  state: "state-1234567890",
});
assert.equal(validateAuthorizeRequest(authorize, origin).resource, urls.resource.href);
assert.throws(() => validateAuthorizeRequest(new URLSearchParams({ ...Object.fromEntries(authorize), resource: "https://attacker.example/mcp" }), origin));
assert.equal(validRedirectUri("https://agent.example/callback"), true);
assert.equal(validRedirectUri("http://localhost:4321/callback"), true);
assert.equal(validRedirectUri("cursor://anysphere.cursor-mcp/oauth/callback"), true);
assert.equal(validRedirectUri("cursor://other/callback"), false);
assert.equal(validRedirectUri("https://user:pass@agent.example/callback"), false);
assert.equal(validAuthorizePostOrigin(new Headers({ origin }), origin), true);
assert.equal(validAuthorizePostOrigin(new Headers({ origin: "https://attacker.example" }), origin), false);
assert.equal(validAuthorizePostOrigin(new Headers({ origin: "not a url" }), origin), false);
assert.equal(validAuthorizePostOrigin(new Headers({
  origin: "null",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
}), origin), true);
assert.equal(validAuthorizePostOrigin(new Headers({
  origin: "null",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "cross-site",
}), origin), false);
const opaqueOriginAuthHeaders = authorizeActorHeaders(new Headers({
  cookie: "payload-token=fixture",
  origin: "null",
  "sec-fetch-site": "same-origin",
}));
assert.equal(opaqueOriginAuthHeaders.has("origin"), false);
assert.equal(opaqueOriginAuthHeaders.get("cookie"), "payload-token=fixture");
assert.equal(digestAgentSecret("fixture-token", "fixture-secret"), digestAgentSecret("fixture-token", "fixture-secret"));
assert.notEqual(digestAgentSecret("fixture-token", "fixture-secret"), digestAgentSecret("other-token", "fixture-secret"));

const oversizedRegistration = await handleRegistrationPost(new Request(`${origin}/api/agent/oauth/register`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ client_name: "x".repeat(33_000) }),
}), {} as Payload);
assert.equal(oversizedRegistration.status, 413);

const oversizedForm = new URLSearchParams({ token: "x".repeat(9_000) });
const oversizedToken = await handleTokenPost(new Request(`${origin}/api/agent/oauth/token`, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: oversizedForm,
}), {} as Payload, origin, "fixture-secret");
assert.equal(oversizedToken.status, 413);
const oversizedRevoke = await handleRevokePost(new Request(`${origin}/api/agent/oauth/revoke`, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: oversizedForm,
}), {} as Payload, "fixture-secret");
assert.equal(oversizedRevoke.status, 413);

let expiredClientDeleted = false;
const registrationPayload = {
  async count({ collection }: { collection: string }) {
    return { totalDocs: collection === "agent-connections" ? 0 : 0 };
  },
  async create({ data }: { data: Record<string, unknown> }) {
    return { id: 2, createdAt: new Date().toISOString(), ...data };
  },
  async delete() {
    expiredClientDeleted = true;
  },
  async find() {
    return { docs: [{ id: 1 }] };
  },
} as unknown as Payload;
const registered = await handleRegistrationPost(new Request(`${origin}/api/agent/oauth/register`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ client_name: "Fixture Agent", redirect_uris: ["http://127.0.0.1:54321/callback"] }),
}), registrationPayload);
assert.equal(registered.status, 201);
assert.equal(expiredClientDeleted, true);

function authorizeUrl() {
  return `${urls.authorization.href}?${authorize.toString()}`;
}

function oauthPayload(personId: number | null, authenticated = true) {
  const approvals = new Set<string>();
  return {
    async auth() {
      return { user: authenticated ? { accountStatus: "active", id: 5, role: "author" } : null };
    },
    async create({ data }: { data: { requestId: string } }) {
      if (approvals.has(data.requestId)) throw { code: "23505" };
      approvals.add(data.requestId);
      return { id: approvals.size, ...data };
    },
    async find({ collection }: { collection: string }) {
      if (collection === "people") return { docs: personId === null ? [] : [{ id: personId }] };
      if (collection === "agent-oauth-clients") {
        return {
          docs: [{
            clientFamily: "fixture",
            clientName: "Fixture Agent",
            redirectUris: [{ uri: authorize.get("redirect_uri")! }],
          }],
        };
      }
      return { docs: [] };
    },
  } as unknown as Payload;
}

const loginRedirect = await handleAuthorizeGet(new Request(authorizeUrl()), oauthPayload(7, false), origin, "fixture-secret");
assert.equal(loginRedirect.status, 302);
assert.match(loginRedirect.headers.get("location") ?? "", /\/admin\/login\?redirect=/);
assert.match(loginRedirect.headers.get("set-cookie") ?? "", /cif_agent_authorize=/);

const unlinked = await handleAuthorizeGet(new Request(authorizeUrl()), oauthPayload(null), origin, "fixture-secret");
assert.equal((await unlinked.json() as { error: string }).error, "access_denied");

const linkedPayload = oauthPayload(7);
const consent = await handleAuthorizeGet(new Request(authorizeUrl()), linkedPayload, origin, "fixture-secret");
assert.equal(consent.status, 200);
assert.match(consent.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
assert.match(consent.headers.get("content-security-policy") ?? "", /form-action 'self' http:\/\/127\.0\.0\.1:54321/);
const consentText = await consent.text();
assert.match(consentText, /Read and edit your drafts/);
assert.match(consentText, /Keep this connection signed in/);
assert.doesNotMatch(consentText, /agent:member|offline_access/);
const approval = consentText.match(/name="approval" value="([^"]+)"/)?.[1];
assert.ok(approval);
const approvalValue = approval;

const accessReadPayload = {
  async auth() {
    return { user: { accountStatus: "active", id: 5, role: "author" } };
  },
  async find({ collection, where }: { collection: string; where?: Record<string, unknown> }) {
    if (collection === "agent-connections") {
      if (JSON.stringify(where).includes('"exists":true')) {
        return {
          docs: [
            { client: 3, createdAt: "2026-07-31T06:00:00.000Z", id: 10, lastUsedAt: "2026-07-31T08:00:00.000Z", state: "active" },
          ],
        };
      }
      return {
        docs: [
          { client: 3, createdAt: "2026-07-31T07:00:00.000Z", id: 9, lastUsedAt: null, state: "active" },
        ],
      };
    }
    if (collection === "agent-oauth-clients") {
      return { docs: [{ clientName: "Cursor", id: 3 }] };
    }
    return { docs: [] };
  },
} as unknown as Payload;
const accessRead = await handleAgentAccessGet(new Request(`${origin}/api/agent/access`), accessReadPayload, origin, true);
const accessReadData = await accessRead.json() as { connections: Array<{ client: string; id: number }> };
assert.equal(accessReadData.connections[0]?.client, "Cursor");
assert.equal(accessReadData.connections[0]?.id, 10);
for (const adapter of ["cursor", "trae", "workbuddy", "claude", "gemini"]) {
  const fixture = await handleAgentAccessGet(new Request(`${origin}/api/agent/access?download=${adapter}`), accessReadPayload, origin, true);
  assert.equal(fixture.status, 200);
  const parsed = JSON.parse(await fixture.text()) as { mcpServers: Record<string, unknown> };
  assert.ok(parsed.mcpServers["china-in-fact"]);
}
const codexFixture = await handleAgentAccessGet(new Request(`${origin}/api/agent/access?download=codex`), accessReadPayload, origin, true);
const codexFixtureText = await codexFixture.text();
assert.match(codexFixtureText, /mcp_servers\.china-in-fact/);
assert.match(codexFixtureText, /http:\/\/localhost:3000\/api\/agent\/mcp/);
const disabledAccess = await handleAgentAccessGet(new Request(`${origin}/api/agent/access`), accessReadPayload, origin, false);
assert.deepEqual((await disabledAccess.json() as { adapters: string[] }).adapters, []);
const disabledDownload = await handleAgentAccessGet(new Request(`${origin}/api/agent/access?download=cursor`), accessReadPayload, origin, false);
assert.equal(disabledDownload.status, 404);

function denyRequest() {
  return new Request(urls.authorization, {
    method: "POST",
    headers: { origin },
    body: new URLSearchParams({ action: "deny", approval: approvalValue }),
  });
}
const denied = await handleAuthorizePost(denyRequest(), linkedPayload, origin, "fixture-secret");
assert.equal(denied.status, 302);
assert.equal(new URL(denied.headers.get("location")!).searchParams.get("error"), "access_denied");
const replayed = await handleAuthorizePost(denyRequest(), linkedPayload, origin, "fixture-secret");
assert.equal((await replayed.json() as { error: string }).error, "invalid_request");

let crossAccountUpdated = false;
const superAdminPayload = {
  async auth() {
    return { user: { accountStatus: "active", id: 5, role: "super_admin" } };
  },
  async findByID() {
    return { id: 11, state: "active", user: { id: 9 }, client: { clientFamily: "fixture" } };
  },
  async update() {
    crossAccountUpdated = true;
  },
} as unknown as Payload;
const crossAccountRevoke = await handleAgentAccessPost(new Request(`${origin}/api/agent/access`, {
  method: "POST",
  headers: { "content-type": "application/json", origin },
  body: JSON.stringify({ action: "revoke", id: 11 }),
}), superAdminPayload, origin);
assert.equal(crossAccountRevoke.status, 404);
assert.equal(crossAccountUpdated, false);

const anonymous = await gateway(mcpRequest());
assert.equal(anonymous.status, 401);
assert.match(anonymous.headers.get("www-authenticate") ?? "", /resource_metadata=/);

const invalid = await gateway(mcpRequest("bad-token"));
assert.equal(invalid.status, 401);

const wrongResourceGateway = createAgentGateway({
  origin,
  verifier: { async verifyAccessToken(token) { return { token, clientId: "fixture", scopes: ["agent:member"], expiresAt: now + 60, resource: new URL("https://attacker.example/mcp") }; } },
  serverFactory: () => new McpServer({ name: "fixture", version: "1" }),
});
assert.equal((await wrongResourceGateway(mcpRequest("fixture-token"))).status, 401);

const wrongHostRequest = mcpRequest("fixture-token");
wrongHostRequest.headers.set("host", "attacker.example");
assert.equal((await gateway(wrongHostRequest)).status, 403);

const wrongOriginRequest = mcpRequest("fixture-token");
wrongOriginRequest.headers.set("origin", "https://attacker.example");
assert.equal((await gateway(wrongOriginRequest)).status, 403);

const initialized = await gateway(mcpRequest("fixture-token"));
assert.equal(initialized.status, 200);
const initializedBody = await initialized.text();
assert.match(initializedBody, /"jsonrpc":"2.0"/);
assert.match(initializedBody, /"name":"china-in-fact"/);

console.log("Agent HTTP/MCP spike tests PASS.");
