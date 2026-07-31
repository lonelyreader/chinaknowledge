import {
  createMcpHandler,
  hostHeaderValidationResponse,
  originValidationResponse,
  requireBearerAuth,
  type McpServerFactory,
  type OAuthTokenVerifier,
} from "@modelcontextprotocol/server";

import { agentUrls } from "./metadata";
import { createAgentMcpServer } from "./server";

export type AgentGatewayOptions = {
  origin: string | URL;
  serverFactory?: McpServerFactory;
  verifier: OAuthTokenVerifier;
};

export function createAgentGateway(options: AgentGatewayOptions) {
  const urls = agentUrls(options.origin);
  const allowedHostnames = [urls.resource.hostname];
  const mcp = createMcpHandler(options.serverFactory ?? createAgentMcpServer, {
    legacy: "stateless",
    responseMode: "auto",
  });
  const authorize = requireBearerAuth({
    verifier: options.verifier,
    requiredScopes: ["agent:member"],
    resourceMetadataUrl: urls.protectedResourceMetadata.href,
  });

  return async function agentGateway(request: Request) {
    const rejected =
      hostHeaderValidationResponse(request, allowedHostnames) ??
      originValidationResponse(request, allowedHostnames);
    if (rejected) return rejected;

    const authInfo = await authorize(request);
    if (authInfo instanceof Response) return authInfo;
    if (authInfo.resource?.href.replace(/\/$/, "") !== urls.resource.href.replace(/\/$/, "")) {
      return Response.json(
        { error: "invalid_token", error_description: "Token resource does not match." },
        {
          headers: {
            "Cache-Control": "no-store",
            "WWW-Authenticate": `Bearer resource_metadata="${urls.protectedResourceMetadata.href}"`,
          },
          status: 401,
        },
      );
    }

    const response = await mcp.fetch(request, { authInfo });
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
  };
}
