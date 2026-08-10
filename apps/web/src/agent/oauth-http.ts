import { createHash, randomBytes, randomUUID, webcrypto } from "node:crypto";

import OAuth2Server from "@node-oauth/oauth2-server";
import type { Payload } from "payload";

import { isCMSUser } from "@/cms/roles";

import { agentScopes, agentUrls } from "./metadata";
import { createAgentOAuthServer } from "./oauth-model";
import { agentRefreshTokenFamily, digestAgentSecret } from "./tokens";

const continuationCookie = "cif_agent_authorize";
const oauthFormLimit = 8_192;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

class RequestBodyTooLarge extends Error {}

type AuthorizeRequest = {
  client_id: string;
  code_challenge: string;
  code_challenge_method: "S256";
  redirect_uri: string;
  resource: string;
  response_type: "code";
  scope: string;
  state: string;
};

function headersRecord(headers: Headers) {
  return Object.fromEntries(headers.entries());
}

function oauthRequest(request: Request, values: Record<string, string>) {
  const headers = headersRecord(request.headers);
  if (request.method === "POST" && !headers["content-length"] && !headers["transfer-encoding"]) {
    headers["content-length"] = "1";
  }
  return new OAuth2Server.Request({
    body: request.method === "POST" ? values : undefined,
    headers,
    method: request.method,
    query: request.method === "GET" ? values : {},
  });
}

function oauthFailure(error: unknown) {
  if (error instanceof RequestBodyTooLarge) {
    return Response.json(
      { error: "invalid_request", error_description: "The request body is too large." },
      { headers: { "Cache-Control": "no-store" }, status: 413 },
    );
  }
  if (error instanceof OAuth2Server.OAuthError) {
    return Response.json(
      { error: error.name, error_description: error.message },
      { headers: { "Cache-Control": "no-store" }, status: error.code || 400 },
    );
  }
  return Response.json(
    { error: "server_error", error_description: "The authorization service is unavailable." },
    { headers: { "Cache-Control": "no-store" }, status: 500 },
  );
}

function logOAuthFailure(operation: string, error: unknown) {
  if (error instanceof OAuth2Server.OAuthError || error instanceof RequestBodyTooLarge) return;
  const detail = error instanceof Error
    ? { message: error.message, name: error.name, stack: error.stack }
    : { message: "Unknown OAuth failure", name: typeof error };
  console.error(`[agent-oauth] ${operation} failed`, detail);
}

async function limitedFormText(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > oauthFormLimit) {
    throw new RequestBodyTooLarge();
  }
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > oauthFormLimit) {
      await reader.cancel();
      throw new RequestBodyTooLarge();
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(body);
}

function exactScope(value: string) {
  const scopes = [...new Set(value.split(/\s+/).filter(Boolean))];
  return scopes.includes("agent:member") && scopes.every((scope) => agentScopes.includes(scope as never))
    ? scopes.join(" ")
    : null;
}

export function validateAuthorizeRequest(input: URLSearchParams, origin: string | URL): AuthorizeRequest {
  const urls = agentUrls(origin);
  const scope = exactScope(input.get("scope") ?? "agent:member");
  const value = {
    client_id: input.get("client_id") ?? "",
    code_challenge: input.get("code_challenge") ?? "",
    code_challenge_method: input.get("code_challenge_method") ?? "",
    redirect_uri: input.get("redirect_uri") ?? "",
    resource: input.get("resource") ?? "",
    response_type: input.get("response_type") ?? "",
    scope,
    state: input.get("state") ?? "",
  };
  if (
    !value.client_id
    || !/^[A-Za-z0-9_-]{43}$/.test(value.code_challenge)
    || value.code_challenge_method !== "S256"
    || !value.redirect_uri
    || value.resource !== urls.resource.href
    || value.response_type !== "code"
    || !value.scope
    || value.state.length < 16
    || value.state.length > 512
  ) throw new OAuth2Server.InvalidRequestError("Invalid authorization request.");
  return value as AuthorizeRequest;
}

export function validAuthorizePostOrigin(headers: Headers, origin: string | URL) {
  const requestOrigin = headers.get("origin");
  if (!requestOrigin) return true;
  if (requestOrigin === "null") {
    return headers.get("sec-fetch-site") === "same-origin"
      && headers.get("sec-fetch-mode") === "navigate"
      && headers.get("sec-fetch-dest") === "document";
  }
  try {
    return new URL(requestOrigin).origin === new URL(origin).origin;
  } catch {
    return false;
  }
}

export function authorizeActorHeaders(headers: Headers) {
  const value = new Headers(headers);
  if (value.get("origin") === "null") value.delete("origin");
  return value;
}

function redirectError(redirectUri: string, state: string, error: string) {
  const target = new URL(redirectUri);
  target.searchParams.set("error", error);
  target.searchParams.set("state", state);
  return Response.redirect(target, 302);
}

function cookieValue(request: Request, name: string) {
  const match = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

async function seal(value: unknown, secret: string) {
  const key = await webcrypto.subtle.importKey("raw", createHash("sha256").update(secret).digest(), "AES-GCM", false, ["encrypt"]);
  const iv = randomBytes(12);
  const encrypted = await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(value)));
  return `ct1_${Buffer.concat([iv, Buffer.from(encrypted)]).toString("base64url")}`;
}

async function openSeal<T>(token: string, secret: string): Promise<T> {
  if (!token.startsWith("ct1_")) throw new Error("Invalid continuation.");
  const value = Buffer.from(token.slice(4), "base64url");
  const key = await webcrypto.subtle.importKey("raw", createHash("sha256").update(secret).digest(), "AES-GCM", false, ["decrypt"]);
  const decrypted = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv: value.subarray(0, 12) }, key, value.subarray(12));
  return JSON.parse(decoder.decode(decrypted)) as T;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

function formActionSource(redirectUri: string) {
  const redirect = new URL(redirectUri);
  return redirect.protocol === "http:" || redirect.protocol === "https:"
    ? redirect.origin
    : redirect.protocol;
}

async function actorForRequest(request: Request, payload: Payload, headers = request.headers) {
  const { user } = await payload.auth({ headers });
  if (!isCMSUser(user)) return null;
  const people = await payload.find({
    collection: "people",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { user: { equals: user.id } },
  });
  const person = people.docs[0];
  return { personId: person?.id ?? null, role: user.role, userId: user.id };
}

function linkedActor(actor: Awaited<ReturnType<typeof actorForRequest>>) {
  if (!actor) return null;
  if (actor.personId === null) throw new OAuth2Server.AccessDeniedError("A linked member profile is required.");
  return { ...actor, personId: actor.personId };
}

function uniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && uniqueViolation(error.cause);
}

async function consumeApproval(
  payload: Payload,
  actor: NonNullable<ReturnType<typeof linkedActor>>,
  clientFamily: string,
  approvalId: string,
  result: "denied" | "success",
) {
  try {
    await payload.create({
      collection: "agent-events",
      overrideAccess: true,
      data: {
        user: actor.userId,
        clientFamily,
        tool: "authorization_approval",
        objectType: "connection",
        requestId: `auth_${approvalId}`,
        idempotencyDigest: `auth_${approvalId}`,
        result,
        occurredAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (uniqueViolation(error)) throw new OAuth2Server.InvalidRequestError("Authorization approval was already used.");
    throw error;
  }
}

async function oauthClient(payload: Payload, clientId: string) {
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
  return result.docs[0] ?? null;
}

function acceptsRedirect(client: Awaited<ReturnType<typeof oauthClient>>, redirectUri: string) {
  return Boolean(client?.redirectUris.some(({ uri }) => uri === redirectUri));
}

export async function handleAuthorizeGet(request: Request, payload: Payload, origin: string, secret: string) {
  try {
    const url = new URL(request.url);
    let params: AuthorizeRequest;
    if (url.searchParams.get("resume") === "1") {
      const continuation = cookieValue(request, continuationCookie);
      if (!continuation) throw new OAuth2Server.InvalidRequestError("Authorization continuation expired.");
      const stored = await openSeal<{ exp: number; params: AuthorizeRequest }>(continuation, secret);
      if (stored.exp < Date.now()) throw new OAuth2Server.InvalidRequestError("Authorization continuation expired.");
      params = stored.params;
    } else {
      params = validateAuthorizeRequest(url.searchParams, origin);
    }
    const client = await oauthClient(payload, params.client_id);
    if (!client || !acceptsRedirect(client, params.redirect_uri)) throw new OAuth2Server.InvalidClientError("Unknown client or redirect URI.");

    const identity = await actorForRequest(request, payload);
    if (!identity) {
      const continuation = await seal({ exp: Date.now() + 5 * 60_000, params }, secret);
      const redirect = encodeURIComponent("/api/agent/oauth/authorize?resume=1");
      const headers = new Headers({
        Location: new URL(`/admin/login?redirect=${redirect}`, origin).href,
      });
      headers.append("Set-Cookie", `${continuationCookie}=${continuation}; HttpOnly; SameSite=Lax; Path=/api/agent/oauth/authorize; Max-Age=300${origin.startsWith("https:") ? "; Secure" : ""}`);
      return new Response(null, { headers, status: 302 });
    }
    const actor = linkedActor(identity);

    const approval = await seal({ actor, approvalId: randomBytes(24).toString("base64url"), exp: Date.now() + 5 * 60_000, params }, secret);
    const redirectHost = new URL(params.redirect_uri).host;
    const persistentAccess = params.scope.split(" ").includes("offline_access")
      ? "<li>Keep this connection signed in</li>"
      : "";
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Agent access — China, in Fact</title></head><body><main><h1>Agent access</h1><p>${escapeHtml(client.clientName)}</p><p>${escapeHtml(redirectHost)}</p><ul><li>Read and edit your drafts</li>${persistentAccess}</ul><form method="post"><input type="hidden" name="approval" value="${escapeHtml(approval)}"><button name="action" value="allow">Allow</button><button name="action" value="deny">Deny</button></form></main></body></html>`;
    const response = new Response(html, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Security-Policy": `default-src 'none'; base-uri 'none'; form-action 'self' ${formActionSource(params.redirect_uri)}; frame-ancestors 'none'`,
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
    response.headers.append("Set-Cookie", `${continuationCookie}=; HttpOnly; SameSite=Lax; Path=/api/agent/oauth/authorize; Max-Age=0${origin.startsWith("https:") ? "; Secure" : ""}`);
    return response;
  } catch (error) {
    return oauthFailure(error);
  }
}

export async function handleAuthorizePost(request: Request, payload: Payload, origin: string, secret: string) {
  try {
    if (!validAuthorizePostOrigin(request.headers, origin)) throw new OAuth2Server.InvalidRequestError("Invalid request origin.");
    const form = new URLSearchParams(await limitedFormText(request));
    const approval = form.get("approval") ?? "";
    const stored = await openSeal<{ actor: { personId: number; userId: number }; approvalId: string; exp: number; params: AuthorizeRequest }>(approval, secret);
    if (stored.exp < Date.now()) throw new OAuth2Server.InvalidRequestError("Authorization approval expired.");
    if (!/^[A-Za-z0-9_-]{32}$/.test(stored.approvalId)) throw new OAuth2Server.InvalidRequestError("Invalid authorization approval.");
    const actor = linkedActor(await actorForRequest(request, payload, authorizeActorHeaders(request.headers)));
    if (!actor || String(actor.userId) !== String(stored.actor.userId) || String(actor.personId) !== String(stored.actor.personId)) throw new OAuth2Server.AccessDeniedError("Account changed during authorization.");
    const client = await oauthClient(payload, stored.params.client_id);
    if (!client || !acceptsRedirect(client, stored.params.redirect_uri)) throw new OAuth2Server.InvalidClientError("Unknown client or redirect URI.");
    const allowed = form.get("action") === "allow";
    await consumeApproval(payload, actor, client.clientFamily, stored.approvalId, allowed ? "success" : "denied");
    if (!allowed) return redirectError(stored.params.redirect_uri, stored.params.state, "access_denied");

    const server = createAgentOAuthServer(payload, secret, agentUrls(origin).resource.href);
    const oauthResponse = new OAuth2Server.Response();
    await server.authorize(oauthRequest(new Request(request.url, { method: "GET", headers: request.headers }), stored.params), oauthResponse, {
      authenticateHandler: { handle: async () => ({ ...actor, resource: stored.params.resource }) },
    });
    const location = oauthResponse.headers?.location;
    if (!location) throw new Error("Authorization redirect missing.");
    return Response.redirect(location, oauthResponse.status ?? 302);
  } catch (error) {
    logOAuthFailure("authorize_post", error);
    return oauthFailure(error);
  }
}

export async function handleTokenPost(request: Request, payload: Payload, origin: string, secret: string) {
  try {
    if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) throw new OAuth2Server.InvalidRequestError("Form encoding is required.");
    const body = Object.fromEntries(new URLSearchParams(await limitedFormText(request)).entries());
    const resource = tokenRequestResource(body, origin);
    body.resource = resource;
    const server = createAgentOAuthServer(payload, secret, resource);
    const oauthResponse = new OAuth2Server.Response();
    const token = await server.token(oauthRequest(request, body), oauthResponse);
    return Response.json(oauthResponse.body ?? token, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" }, status: oauthResponse.status ?? 200 });
  } catch (error) {
    return oauthFailure(error);
  }
}

export function tokenRequestResource(body: Record<string, string>, origin: string | URL) {
  const expected = agentUrls(origin).resource.href;
  if (body.grant_type === "refresh_token") {
    if (body.resource && body.resource !== expected) throw new OAuth2Server.InvalidGrantError("Invalid resource.");
    return expected;
  }
  if (body.resource !== expected) throw new OAuth2Server.InvalidGrantError("Invalid resource.");
  return expected;
}

export async function handleRevokePost(request: Request, payload: Payload, secret: string) {
  try {
    const body = new URLSearchParams(await limitedFormText(request));
    const token = body.get("token");
    if (token) {
      const digest = digestAgentSecret(token, secret);
      const tokenFamily = agentRefreshTokenFamily(token, secret);
      const result = await payload.find({
        collection: "agent-connections",
        depth: 1,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          or: [
            { accessTokenDigest: { equals: digest } },
            { refreshTokenDigest: { equals: digest } },
            ...(tokenFamily ? [{ tokenFamily: { equals: tokenFamily } }] : []),
          ],
        },
      });
      const connection = result.docs[0];
      if (connection?.state === "active") {
        const revokedAt = new Date().toISOString();
        await payload.update({
          collection: "agent-connections",
          id: connection.id,
          overrideAccess: true,
          data: { state: "revoked", revokedAt },
        });
        const user = typeof connection.user === "number" ? connection.user : connection.user.id;
        const client = connection.client;
        let clientFamily = typeof client === "number" ? "unknown" : client.clientFamily;
        if (typeof client === "number") {
          try {
            const record = await payload.findByID({
              collection: "agent-oauth-clients",
              id: client,
              depth: 0,
              overrideAccess: true,
            });
            clientFamily = record.clientFamily;
          } catch {
            // The connection stays revoked if display-only client metadata is unavailable.
          }
        }
        await payload.create({
          collection: "agent-events",
          overrideAccess: true,
          data: {
            user,
            connection: connection.id,
            clientFamily,
            tool: "oauth_revoke",
            objectType: "connection",
            objectId: String(connection.id),
            requestId: `revoke_${randomUUID()}`,
            result: "success",
            occurredAt: revokedAt,
          },
        });
      }
    }
    return new Response(null, { headers: { "Cache-Control": "no-store" }, status: 200 });
  } catch (error) {
    if (error instanceof RequestBodyTooLarge) {
      return Response.json(
        { error: "invalid_request" },
        { headers: { "Cache-Control": "no-store" }, status: 413 },
      );
    }
    return new Response(null, { headers: { "Cache-Control": "no-store" }, status: 200 });
  }
}

const supportedCustomRedirectUris = new Set([
  "cursor://anysphere.cursor-mcp/oauth/callback",
  "workbuddy://workbuddy/mcp/custom-mcp%3Achina-in-fact/oauth/callback",
]);

export function validRedirectUri(value: string) {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.hash || value.length > 2048) return false;
    if (supportedCustomRedirectUris.has(url.href)) return true;
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}
