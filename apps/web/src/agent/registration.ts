import { randomBytes } from "node:crypto";

import type { Payload } from "payload";

import { validRedirectUri } from "./oauth-http";

type RegistrationBody = {
  client_name?: unknown;
  grant_types?: unknown;
  redirect_uris?: unknown;
  response_types?: unknown;
  token_endpoint_auth_method?: unknown;
};

async function limitedJSON(request: Request, limit: number) {
  if (!request.body) throw new Error("invalid_client_metadata");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new Error("too_large");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)) as RegistrationBody;
}

async function removeExpiredUnboundClients(payload: Payload, now: Date) {
  const expired = await payload.find({
    collection: "agent-oauth-clients",
    depth: 0,
    limit: 5,
    overrideAccess: true,
    pagination: false,
    sort: "expiresAt",
    where: { expiresAt: { less_than: now.toISOString() } },
  });
  for (const client of expired.docs) {
    const connections = await payload.count({
      collection: "agent-connections",
      overrideAccess: true,
      where: { client: { equals: client.id } },
    });
    if (connections.totalDocs === 0) {
      await payload.delete({ collection: "agent-oauth-clients", id: client.id, overrideAccess: true });
    }
  }
}

function clientFamily(name: string) {
  const normalized = name.toLowerCase();
  for (const family of ["cursor", "trae", "workbuddy", "codex", "claude", "gemini"]) {
    if (normalized.includes(family)) return family;
  }
  return "other";
}

export async function handleRegistrationPost(request: Request, payload: Payload) {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 32_768) throw new Error("too_large");
    const body = await limitedJSON(request, 32_768);
    const clientName = typeof body.client_name === "string" ? body.client_name.trim() : "";
    const redirectUris = Array.isArray(body.redirect_uris) ? [...new Set(body.redirect_uris)] : [];
    const grantTypes = body.grant_types ?? ["authorization_code", "refresh_token"];
    const responseTypes = body.response_types ?? ["code"];
    if (
      clientName.length < 1
      || clientName.length > 120
      || redirectUris.length < 1
      || redirectUris.length > 8
      || !redirectUris.every((uri) => typeof uri === "string" && validRedirectUri(uri))
      || !Array.isArray(grantTypes)
      || grantTypes.some((grant) => grant !== "authorization_code" && grant !== "refresh_token")
      || !grantTypes.includes("authorization_code")
      || !Array.isArray(responseTypes)
      || responseTypes.length !== 1
      || responseTypes[0] !== "code"
      || (body.token_endpoint_auth_method ?? "none") !== "none"
    ) throw new Error("invalid_client_metadata");

    const now = new Date();
    await removeExpiredUnboundClients(payload, now);
    const [recent, unbound] = await Promise.all([
      payload.count({
        collection: "agent-oauth-clients",
        overrideAccess: true,
        where: { createdAt: { greater_than: new Date(now.getTime() - 60_000).toISOString() } },
      }),
      payload.count({
        collection: "agent-oauth-clients",
        overrideAccess: true,
        where: { expiresAt: { greater_than: now.toISOString() } },
      }),
    ]);
    if (recent.totalDocs >= 50 || unbound.totalDocs >= 500) return Response.json({ error: "too_many_requests" }, { status: 429 });

    const clientId = `cif_${randomBytes(24).toString("base64url")}`;
    const created = await payload.create({
      collection: "agent-oauth-clients",
      overrideAccess: true,
      data: {
        clientId,
        clientName,
        clientFamily: clientFamily(clientName),
        redirectUris: redirectUris.map((uri) => ({ uri: String(uri) })),
        grantTypes: grantTypes as ("authorization_code" | "refresh_token")[],
        tokenEndpointAuthMethod: "none",
        disabled: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      },
    });
    return Response.json({
      client_id: created.clientId,
      client_id_issued_at: Math.floor(new Date(created.createdAt).getTime() / 1000),
      client_name: created.clientName,
      redirect_uris: created.redirectUris.map(({ uri }) => uri),
      grant_types: created.grantTypes,
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    }, { headers: { "Cache-Control": "no-store" }, status: 201 });
  } catch (error) {
    const code = error instanceof Error && error.message === "too_large" ? 413 : 400;
    return Response.json({ error: "invalid_client_metadata" }, { headers: { "Cache-Control": "no-store" }, status: code });
  }
}
