import {
  buildOAuthProtectedResourceMetadata,
  getOAuthProtectedResourceMetadataUrl,
} from "@modelcontextprotocol/server";

export const agentScopes = ["agent:member", "offline_access"] as const;

export function agentUrls(origin: string | URL) {
  const base = new URL(origin);
  const resource = new URL("/api/agent/mcp", base);
  const issuer = new URL("/api/agent/oauth", base);
  return {
    authorization: new URL("/api/agent/oauth/authorize", base),
    issuer,
    protectedResourceMetadata: new URL(getOAuthProtectedResourceMetadataUrl(resource)),
    registration: new URL("/api/agent/oauth/register", base),
    resource,
    revocation: new URL("/api/agent/oauth/revoke", base),
    token: new URL("/api/agent/oauth/token", base),
  };
}

export function buildAgentAuthorizationServerMetadata(origin: string | URL) {
  const urls = agentUrls(origin);
  return {
    issuer: urls.issuer.href.replace(/\/$/, ""),
    authorization_endpoint: urls.authorization.href,
    token_endpoint: urls.token.href,
    registration_endpoint: urls.registration.href,
    revocation_endpoint: urls.revocation.href,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: [...agentScopes],
  };
}

export function buildAgentProtectedResourceMetadata(origin: string | URL) {
  const urls = agentUrls(origin);
  const base = new URL(origin);
  return buildOAuthProtectedResourceMetadata({
    oauthMetadata: buildAgentAuthorizationServerMetadata(base),
    resourceServerUrl: urls.resource,
    resourceName: "China, in Fact",
    scopesSupported: ["agent:member"],
    dangerouslyAllowInsecureIssuerUrl:
      base.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname),
  });
}

export function metadataResponse(value: unknown) {
  return Response.json(value, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}
