import assert from "node:assert/strict";

import config from "@payload-config";
import { McpServer, OAuthError, type AuthInfo, type OAuthTokenVerifier } from "@modelcontextprotocol/server";
import { APIError, type Payload } from "payload";

import { handleAgentAccessGet, handleAgentAccessPost } from "@/agent/access-route";
import { AGENT_BODY_V2_VERSION } from "@/agent/contracts";
import { createAgentGateway } from "@/agent/gateway";
import { createArticleRevision } from "@/agent/revision";
import { AgentMemberService } from "@/agent/service";
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
  tokenRequestResource,
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
assert.equal(tokenRequestResource({ grant_type: "refresh_token" }, origin), urls.resource.href);
assert.equal(tokenRequestResource({ grant_type: "refresh_token", resource: urls.resource.href }, origin), urls.resource.href);
assert.throws(() => tokenRequestResource({ grant_type: "refresh_token", resource: "https://attacker.example/mcp" }, origin));
assert.throws(() => tokenRequestResource({ grant_type: "authorization_code" }, origin));
assert.equal(validRedirectUri("https://agent.example/callback"), true);
assert.equal(validRedirectUri("http://localhost:4321/callback"), true);
assert.equal(validRedirectUri("cursor://anysphere.cursor-mcp/oauth/callback"), true);
assert.equal(validRedirectUri("cursor://other/callback"), false);
const workbuddyRedirectUri = "workbuddy://workbuddy/mcp/custom-mcp%3Achina-in-fact/oauth/callback";
assert.equal(validRedirectUri(workbuddyRedirectUri), true);
assert.equal(validRedirectUri("workbuddy://other/mcp/custom-mcp%3Achina-in-fact/oauth/callback"), false);
assert.equal(validRedirectUri("workbuddy://workbuddy/mcp/custom-mcp%3Aother/oauth/callback"), false);
assert.equal(validRedirectUri(`${workbuddyRedirectUri}?next=other`), false);
assert.equal(validRedirectUri(`${workbuddyRedirectUri}#other`), false);
assert.equal(validRedirectUri("workbuddy://user@workbuddy/mcp/custom-mcp%3Achina-in-fact/oauth/callback"), false);
assert.equal(validRedirectUri("workbuddy://workbuddy/oauth/callback"), false);
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
let createdRegistrationData: Record<string, unknown> | undefined;
const registrationPayload = {
  async count({ collection }: { collection: string }) {
    return { totalDocs: collection === "agent-connections" ? 0 : 0 };
  },
  async create({ data }: { data: Record<string, unknown> }) {
    createdRegistrationData = data;
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

const workbuddyRegistered = await handleRegistrationPost(new Request(`${origin}/api/agent/oauth/register`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    client_name: "WorkBuddy Connector (custom-mcp:china-in-fact)",
    grant_types: ["authorization_code", "refresh_token"],
    redirect_uris: [workbuddyRedirectUri],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  }),
}), registrationPayload);
assert.equal(workbuddyRegistered.status, 201);
assert.equal(createdRegistrationData?.clientFamily, "workbuddy");
assert.deepEqual(createdRegistrationData?.redirectUris, [{ uri: workbuddyRedirectUri }]);

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
const accessReadData = await accessRead.json() as { adapters: string[]; connections: Array<{ client: string; id: number }> };
assert.deepEqual(accessReadData.adapters, ["Cursor", "WorkBuddy", "Codex", "Claude", "Gemini"]);
assert.equal(accessReadData.connections[0]?.client, "Cursor");
assert.equal(accessReadData.connections[0]?.id, 10);
for (const adapter of ["cursor", "workbuddy", "claude", "gemini"]) {
  const fixture = await handleAgentAccessGet(new Request(`${origin}/api/agent/access?download=${adapter}`), accessReadPayload, origin, true);
  assert.equal(fixture.status, 200);
  const parsed = JSON.parse(await fixture.text()) as { mcpServers: Record<string, Record<string, unknown>> };
  const server = parsed.mcpServers["china-in-fact"];
  if (adapter === "gemini") {
    assert.deepEqual(server, { httpUrl: `${origin}/api/agent/mcp` });
  } else {
    assert.deepEqual(server, { type: "http", url: `${origin}/api/agent/mcp` });
  }
}
const removedTraeFixture = await handleAgentAccessGet(new Request(`${origin}/api/agent/access?download=trae`), accessReadPayload, origin, true);
assert.equal(removedTraeFixture.status, 404);
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

/*
 * INFRA-AGENT-MEDIA-001: service-level checks for the media tools with a
 * mocked Payload — the four permission negatives from the checklist plus the
 * happy paths for the unique-filename upload pipeline, V2 working copies and
 * the preview pre-publication warnings.
 */
const sanitizedConfig = await config;

function memberAuth(): AuthInfo {
  return {
    token: "fixture-token",
    clientId: "fixture-client",
    scopes: ["agent:member"],
    expiresAt: now + 300,
    resource: urls.resource,
    extra: { clientFamily: "fixture", connectionId: 11, personId: 7, role: "author", userId: 5 },
  } as AuthInfo;
}

type MockDoc = Record<string, unknown>;

function memberServiceFixture(options: {
  accountStatus?: "active" | "paused";
  articles?: Record<number, MockDoc>;
  media?: Record<number, MockDoc>;
  role?: "author" | "editor" | "super_admin";
} = {}) {
  const events: MockDoc[] = [];
  const updates: { collection: string; data: MockDoc; id: unknown }[] = [];
  const mediaCreates: { data: MockDoc; file?: { data: Buffer; mimetype: string; name: string; size: number } }[] = [];
  let mediaSequence = 100;
  const payload = {
    config: sanitizedConfig,
    logger: { error() {}, info() {}, warn() {} },
    db: {
      async beginTransaction() {
        return "tx-fixture";
      },
      async commitTransaction() {},
      async rollbackTransaction() {},
      sessions: {
        "tx-fixture": { db: { async execute() { return { rows: [{ id: 1 }] }; } } },
      },
    },
    async findByID({ collection, id }: { collection: string; id: number | string }) {
      if (collection === "agent-connections") return {
        accessExpiresAt: new Date(Date.now() + 300_000).toISOString(),
        client: 3,
        id,
        person: 7,
        resource: urls.resource.href,
        scopes: ["agent:member"],
        state: "active",
        user: 5,
      };
      if (collection === "agent-oauth-clients") return { disabled: false, expiresAt: null, id: 3 };
      if (collection === "users") return { accountStatus: options.accountStatus ?? "active", displayName: "Fixture Editor", id: 5, role: options.role ?? "author" };
      if (collection === "people") return {
        id: 7,
        languages: ["en"],
        name: "Fixture Member",
        profileStatus: "draft",
        slug: "fixture-member",
        updatedAt: "2026-08-12T00:00:00.000Z",
        user: 5,
      };
      if (collection === "media") {
        const doc = options.media?.[Number(id)];
        if (!doc) throw new APIError("Not Found", 404);
        return doc;
      }
      if (collection === "articles") {
        const doc = options.articles?.[Number(id)];
        if (!doc) throw new APIError("Not Found", 404);
        return doc;
      }
      throw new Error(`Unexpected findByID collection: ${collection}`);
    },
    async find({ collection }: { collection: string }) {
      if (collection === "people") return { docs: [{ id: 7, user: 5 }] };
      if (collection === "agent-events") return { docs: [] };
      if (collection === "media") return { docs: Object.values(options.media ?? {}) };
      return { docs: [] };
    },
    async findVersions() {
      return { docs: [] };
    },
    async create(args: { collection: string; data: MockDoc; file?: { data: Buffer; mimetype: string; name: string; size: number } }) {
      if (args.collection === "agent-events") {
        events.push(args.data);
        return { id: events.length, ...args.data };
      }
      if (args.collection === "media") {
        mediaCreates.push({ data: args.data, file: args.file });
        mediaSequence += 1;
        return {
          id: mediaSequence,
          alt: args.data.alt,
          createdAt: "2026-08-12T00:00:00.000Z",
          filename: args.file?.name ?? null,
          filesize: args.file?.size ?? null,
          mimeType: args.file?.mimetype ?? null,
          updatedAt: "2026-08-12T00:00:00.000Z",
        };
      }
      throw new Error(`Unexpected create collection: ${args.collection}`);
    },
    async update(args: { collection: string; data: MockDoc; id: unknown }) {
      updates.push(args);
      if (args.collection === "articles") return { ...(options.articles?.[Number(args.id)] ?? {}), ...args.data };
      return { id: args.id, ...args.data };
    },
  } as unknown as Payload;
  return { events, mediaCreates, service: AgentMemberService.fromPayload(payload, memberAuth()), updates };
}

// Discovery reads the current server-side User role, not the stale author
// role carried in memberAuth(). Profile readback derives the bound Person and
// returns its preview path without accepting a Person ID.
{
  const fixture = memberServiceFixture({ role: "editor" });
  assert.equal(await fixture.service.currentRole(), "editor");
  const capabilities = await fixture.service.capabilities();
  assert.equal(capabilities.ok, true, JSON.stringify(capabilities));
  assert.equal(capabilities.data?.tools.includes("editorial_article_get"), true);
  assert.equal(capabilities.data?.tools.includes("editorial_attention_list"), true);
  assert.equal(capabilities.data?.tools.includes("editorial_reference_options"), true);
  assert.equal(capabilities.data?.tools.includes("editorial_save_site_fields"), true);
  const assignees = await fixture.service.editorialReferenceOptions({ kind: "assignee" });
  assert.deepEqual(assignees.data?.options, [{ id: 5, label: "Fixture Editor", kind: "assignee" }]);
  const profile = await fixture.service.myProfileGet();
  assert.equal(profile.ok, true, JSON.stringify(profile));
  assert.equal(profile.data?.previewPath, "/en/people/fixture-member?preview=7");
  assert.equal(profile.data?.profileStatus, "draft");
  const incompletePublication = await fixture.service.prepareProfilePublication({ revision: profile.meta!.revision!, targetStatus: "public" });
  assert.equal(incompletePublication.error?.code, "VALIDATION_ERROR");
  assert.deepEqual(incompletePublication.error?.details?.completeness, {
    complete: false,
    missing: ["identity", "introduction", "city", "portrait"],
  });
}

{
  const fixture = memberServiceFixture({ role: "author" });
  assert.equal((await fixture.service.editorialAttentionList()).error?.code, "FORBIDDEN");
  assert.equal((await fixture.service.editorialReferenceOptions({ kind: "assignee" })).error?.code, "FORBIDDEN");
  assert.equal((await fixture.service.editorialSaveSiteFields({ id: 21, idempotencyKey: "editorial_0123456789", patch: { format: "analysis" }, revision: createArticleRevision({ id: 21, locale: "en", updatedAt: "2026-08-12T00:00:00.000Z" }) })).error?.code, "FORBIDDEN");
}

const uploadInput = {
  alt: "A rice terrace at dawn",
  data: Buffer.from("fixture-image-bytes").toString("base64"),
  filename: "terrace.png",
  idempotencyKey: "upload_0123456789abcdef",
  mimeType: "image/png",
};
const ownArticle = {
  id: 21,
  body: { root: { type: "root", children: [] } },
  curationStatus: "none",
  locale: "en",
  owner: 5,
  publicationStatus: "draft",
  slug: "own-article",
  title: "Own article",
  updatedAt: "2026-08-12T00:00:00.000Z",
};
const ownMedia = { id: 32, alt: "Own image", publicUseApprovedAt: null, uploadedBy: 5 };
const foreignMedia = { id: 31, alt: "Foreign image", publicUseApprovedAt: null, uploadedBy: 99 };
const ownRevision = createArticleRevision(ownArticle);

// Negative 4: a paused account is rejected by both new tools, with audit.
{
  const paused = memberServiceFixture({ accountStatus: "paused" });
  const upload = await paused.service.mediaUpload(uploadInput);
  assert.equal(upload.ok, false);
  assert.equal(upload.error?.code, "ACCOUNT_PAUSED");
  const cover = await paused.service.setCover({ id: 21, idempotencyKey: "cover_0123456789abcdef", mediaId: 32, revision: ownRevision });
  assert.equal(cover.ok, false);
  assert.equal(cover.error?.code, "ACCOUNT_PAUSED");
  assert.deepEqual(
    paused.events.map((event) => [event.tool, event.result, event.objectType]),
    [["media_upload", "denied", "account"], ["article_set_cover", "denied", "article"]],
  );
  assert.equal(paused.mediaCreates.length, 0);
  assert.equal(paused.updates.length, 0);
}

// Negative 1: a V2 body image referencing another member's unapproved media is rejected.
{
  const fixture = memberServiceFixture({ media: { 31: foreignMedia } });
  const draft = await fixture.service.createDraft({
    body: { version: AGENT_BODY_V2_VERSION, blocks: [{ type: "image", mediaId: 31, alt: "Foreign image" }] },
    idempotencyKey: "draft_0123456789abcdef",
    locale: "en",
    title: "Media ownership",
  });
  assert.equal(draft.ok, false);
  assert.equal(draft.error?.code, "FORBIDDEN");
  assert.match(draft.error?.message ?? "", /Body image/);
  assert.deepEqual(fixture.events.map((event) => [event.tool, event.result]), [["article_create_draft", "failed"]]);
}

// A non-whitelisted embed URL is rejected by the service as well as the schema.
{
  const fixture = memberServiceFixture();
  const draft = await fixture.service.createDraft({
    body: { version: AGENT_BODY_V2_VERSION, blocks: [{ type: "youtube", url: "https://vimeo.com/123456" }] },
    idempotencyKey: "draft_0123456789abcdeg",
    locale: "en",
    title: "Embed whitelist",
  });
  assert.equal(draft.ok, false);
  assert.equal(draft.error?.code, "VALIDATION_ERROR");
  assert.match(draft.error?.message ?? "", /Only YouTube video links/);
}

// Negative 2: article_set_cover pointing at another member's unapproved media is rejected.
{
  const fixture = memberServiceFixture({ articles: { 21: ownArticle }, media: { 31: foreignMedia } });
  const cover = await fixture.service.setCover({ id: 21, idempotencyKey: "cover_0123456789abcdeh", mediaId: 31, revision: ownRevision });
  assert.equal(cover.ok, false);
  assert.equal(cover.error?.code, "FORBIDDEN");
  assert.match(cover.error?.message ?? "", /Cover image/);
  assert.equal(fixture.updates.some((update) => update.collection === "articles"), false);
  assert.equal(fixture.events.at(-1)?.result, "denied");
  assert.equal(fixture.events.at(-1)?.tool, "article_set_cover");
}

// Negative 3: article_set_cover on another member's article is rejected.
{
  const foreignArticle = { ...ownArticle, id: 22, owner: 99 };
  const fixture = memberServiceFixture({ articles: { 22: foreignArticle }, media: { 32: ownMedia } });
  const cover = await fixture.service.setCover({ id: 22, idempotencyKey: "cover_0123456789abcdei", mediaId: 32, revision: createArticleRevision(foreignArticle) });
  assert.equal(cover.ok, false);
  assert.equal(cover.error?.code, "FORBIDDEN");
  assert.equal(fixture.updates.some((update) => update.collection === "articles"), false);
  assert.equal(fixture.events.at(-1)?.result, "denied");
}

// Upload happy path: unique filename pipeline, owner metadata, audit trail.
{
  const fixture = memberServiceFixture();
  const upload = await fixture.service.mediaUpload(uploadInput);
  assert.equal(upload.ok, true);
  assert.equal(upload.data?.alt, uploadInput.alt);
  assert.equal(upload.data?.publicUseApproved, false);
  assert.equal(upload.meta?.readAfterWrite, true);
  const file = fixture.mediaCreates[0]?.file;
  assert.ok(file);
  assert.match(file.name, /^terrace-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/);
  assert.equal(file.mimetype, "image/png");
  assert.equal(file.data.toString("utf8"), "fixture-image-bytes");
  assert.deepEqual(fixture.events.map((event) => [event.tool, event.result, event.objectType]), [["media_upload", "pending", "account"]]);
  assert.equal(fixture.updates.at(-1)?.data.result, "success");
}

// Upload input validation: bad base64 and non-image types fail fast.
{
  const fixture = memberServiceFixture();
  const badData = await fixture.service.mediaUpload({ ...uploadInput, data: "!!!not-base64!!!" });
  assert.equal(badData.error?.code, "VALIDATION_ERROR");
  const badType = await fixture.service.mediaUpload({ ...uploadInput, mimeType: "application/pdf" });
  assert.equal(badType.error?.code, "VALIDATION_ERROR");
  assert.equal(fixture.mediaCreates.length, 0);
}

// Set-cover happy path: own media, matching revision, audited write.
{
  const fixture = memberServiceFixture({ articles: { 21: ownArticle }, media: { 32: ownMedia } });
  const cover = await fixture.service.setCover({ id: 21, idempotencyKey: "cover_0123456789abcdej", mediaId: 32, revision: ownRevision });
  assert.equal(cover.ok, true);
  assert.equal(cover.data?.coverMediaId, 32);
  const articleUpdate = fixture.updates.find((update) => update.collection === "articles");
  assert.equal(articleUpdate?.data.coverImage, 32);
  assert.equal(fixture.updates.at(-1)?.data.result, "success");
}

// Working copy: V2 returns media blocks with owner-readable alt text; the
// V1 default keeps failing explicitly so existing clients never see drops.
{
  const mediaArticle = {
    ...ownArticle,
    id: 23,
    body: {
      root: {
        type: "root",
        children: [
          { type: "paragraph", children: [{ type: "text", text: "Before.", format: 0 }] },
          { type: "upload", relationTo: "media", value: 32, fields: { caption: "Own caption" } },
          { type: "block", fields: { blockType: "youtubeEmbed", url: "https://youtu.be/dQw4w9WgXcQ" } },
        ],
      },
    },
  };
  const fixture = memberServiceFixture({ articles: { 23: mediaArticle }, media: { 32: ownMedia } });
  const v2 = await fixture.service.workingCopy(23, { bodyVersion: AGENT_BODY_V2_VERSION });
  assert.equal(v2.ok, true);
  assert.deepEqual(v2.data?.body.blocks, [
    { type: "paragraph", children: [{ type: "text", text: "Before." }] },
    { type: "image", mediaId: 32, alt: "Own image", caption: "Own caption" },
    { type: "youtube", url: "https://youtu.be/dQw4w9WgXcQ" },
  ]);
  const v1 = await fixture.service.workingCopy(23);
  assert.equal(v1.ok, false);
  assert.equal(v1.error?.code, "UNSUPPORTED_CONTENT");
}

// Preview returns the structured pre-publication warnings.
{
  const warnArticle = {
    ...ownArticle,
    id: 24,
    summary: "  ",
    body: {
      root: {
        type: "root",
        children: [
          { type: "heading", tag: "h2", children: [] },
          { type: "heading", tag: "h4", children: [] },
          { type: "upload", relationTo: "media", value: 31, fields: {} },
        ],
      },
    },
  };
  const fixture = memberServiceFixture({ articles: { 24: warnArticle }, media: { 31: foreignMedia } });
  const preview = await fixture.service.preview(24);
  assert.equal(preview.ok, true);
  assert.deepEqual(preview.data?.warnings, [
    { code: "missing_cover", message: "The article has no cover image." },
    { code: "missing_summary", message: "The article has no summary." },
    { code: "heading_level_jump", message: "Heading level jumps from h2 to h4.", details: { blockIndex: 1, from: 2, to: 4 } },
    { code: "body_media_ownership", message: "A body image is not media the current member may publish.", details: { mediaId: 31 } },
  ]);
}

// A clean article previews with no warnings.
{
  const cleanArticle = {
    ...ownArticle,
    id: 25,
    coverImage: 32,
    summary: "A summary.",
    body: { root: { type: "root", children: [{ type: "heading", tag: "h2", children: [] }, { type: "heading", tag: "h3", children: [] }] } },
  };
  const fixture = memberServiceFixture({ articles: { 25: cleanArticle }, media: { 32: ownMedia } });
  const preview = await fixture.service.preview(25);
  assert.equal(preview.ok, true);
  assert.deepEqual(preview.data?.warnings, []);
}

console.log("Agent HTTP/MCP spike tests PASS.");
