import { randomUUID } from "node:crypto";

import type { Payload } from "payload";

import { isCMSUser } from "@/cms/roles";
import type { AgentConnection, AgentEvent, AgentOauthClient } from "@/payload-types";

import { agentGatewayEnabled } from "./availability";

const adapters = ["Cursor", "TRAE", "WorkBuddy", "Codex", "Claude", "Gemini"] as const;

function configFile(adapter: string, origin: string) {
  const url = new URL("/api/agent/mcp", origin).href;
  const key = adapter.toLowerCase();
  if (key === "codex") {
    return { body: `[mcp_servers.china-in-fact]\nurl = "${url}"\n`, filename: "china-in-fact-codex.toml", type: "text/plain" };
  }
  if (key === "gemini") {
    return { body: JSON.stringify({ mcpServers: { "china-in-fact": { httpUrl: url } } }, null, 2), filename: "china-in-fact-gemini.json", type: "application/json" };
  }
  const server = key === "claude" ? { type: "http", url } : { url };
  return { body: JSON.stringify({ mcpServers: { "china-in-fact": server } }, null, 2), filename: `china-in-fact-${key}.json`, type: "application/json" };
}

async function currentUser(request: Request, payload: Payload) {
  const { user } = await payload.auth({ headers: request.headers });
  return isCMSUser(user) ? user : null;
}

export async function handleAgentAccessGet(
  request: Request,
  payload: Payload,
  origin: string,
  gatewayEnabled = agentGatewayEnabled(),
) {
  const user = await currentUser(request, payload);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const download = new URL(request.url).searchParams.get("download");
  if (download && !gatewayEnabled) {
    return Response.json({ error: "Not found" }, { headers: { "Cache-Control": "no-store" }, status: 404 });
  }
  if (download && adapters.some((adapter) => adapter.toLowerCase() === download.toLowerCase())) {
    const file = configFile(download, origin);
    return new Response(file.body, { headers: { "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="${file.filename}"`, "Content-Type": `${file.type}; charset=utf-8` } });
  }

  const [usedConnections, events] = await Promise.all([
    payload.find({
      collection: "agent-connections",
      depth: 1,
      limit: 50,
      overrideAccess: false,
      pagination: false,
      sort: "-lastUsedAt",
      user,
      where: { and: [{ user: { equals: user.id } }, { lastUsedAt: { exists: true } }] },
    }),
    payload.find({ collection: "agent-events", depth: 0, limit: 20, overrideAccess: false, pagination: false, sort: "-occurredAt", user, where: { user: { equals: user.id } } }),
  ]);
  const remaining = Math.max(0, 50 - usedConnections.docs.length);
  const unusedConnections = remaining
    ? await payload.find({
        collection: "agent-connections",
        depth: 1,
        limit: remaining,
        overrideAccess: false,
        pagination: false,
        sort: "-createdAt",
        user,
        where: { and: [{ user: { equals: user.id } }, { lastUsedAt: { exists: false } }] },
      })
    : { docs: [] };
  const sortedConnections = [...usedConnections.docs, ...unusedConnections.docs] as AgentConnection[];
  const clientIds = [...new Set(sortedConnections.map((connection) => connection.client).filter((client): client is number => typeof client === "number"))];
  const clients = clientIds.length
    ? await payload.find({
        collection: "agent-oauth-clients",
        depth: 0,
        limit: clientIds.length,
        overrideAccess: true,
        pagination: false,
        where: { id: { in: clientIds } },
      })
    : { docs: [] };
  const clientNames = new Map(clients.docs.map((client) => [String(client.id), client.clientName]));
  return Response.json({
    adapters: gatewayEnabled ? adapters : [],
    connections: sortedConnections.map((connection) => ({
      id: connection.id,
      client: typeof connection.client === "number"
        ? (clientNames.get(String(connection.client)) ?? "Agent")
        : (connection.client as AgentOauthClient).clientName,
      state: connection.state,
      lastUsedAt: connection.lastUsedAt,
    })),
    events: events.docs.map((event: AgentEvent) => ({ id: event.id, tool: event.tool, result: event.result, occurredAt: event.occurredAt })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function handleAgentAccessPost(request: Request, payload: Payload, origin: string) {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin || new URL(requestOrigin).origin !== new URL(origin).origin) {
    return Response.json({ error: "Invalid request" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Invalid request" }, { status: 415 });
  }
  const user = await currentUser(request, payload);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { action?: unknown; id?: unknown };
  if (body.action !== "revoke" || !Number.isInteger(body.id)) return Response.json({ error: "Invalid request" }, { status: 400 });
  let connection: AgentConnection;
  try {
    connection = await payload.findByID({ collection: "agent-connections", id: Number(body.id), depth: 1, overrideAccess: false, user });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const connectionUser = typeof connection.user === "number" ? connection.user : connection.user.id;
  if (String(connectionUser) !== String(user.id)) return Response.json({ error: "Not found" }, { status: 404 });
  if (connection.state === "active") {
    await payload.update({ collection: "agent-connections", id: connection.id, overrideAccess: true, data: { state: "revoked", revokedAt: new Date().toISOString() } });
    const client = connection.client as number | AgentOauthClient;
    let clientFamily = typeof client === "number" ? "unknown" : client.clientFamily;
    if (typeof client === "number") {
      try {
        const record = await payload.findByID({ collection: "agent-oauth-clients", id: client, depth: 0, overrideAccess: true });
        clientFamily = record.clientFamily;
      } catch {
        // Preserve the revocation even if its display-only client metadata no longer exists.
      }
    }
    await payload.create({ collection: "agent-events", overrideAccess: true, data: { user: user.id, connection: connection.id, clientFamily, tool: "connection_revoke", objectType: "connection", objectId: String(connection.id), requestId: `req_${randomUUID()}`, result: "success", occurredAt: new Date().toISOString() } });
  }
  return Response.json({ id: connection.id, state: "revoked" }, { headers: { "Cache-Control": "no-store" } });
}
