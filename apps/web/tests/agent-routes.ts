import assert from "node:assert/strict";

import { GET as authorizationMetadata } from "@/app/(payload)/.well-known/oauth-authorization-server/api/agent/oauth/route";
import { GET as protectedResourceMetadata } from "@/app/(payload)/.well-known/oauth-protected-resource/api/agent/mcp/route";
import {
  DELETE as mcpDelete,
  GET as mcpGet,
  POST as mcpPost,
} from "@/app/(payload)/api/agent/mcp/route";
import {
  GET as authorizeGet,
  POST as authorizePost,
} from "@/app/(payload)/api/agent/oauth/authorize/route";
import { POST as registerPost } from "@/app/(payload)/api/agent/oauth/register/route";
import { POST as revokePost } from "@/app/(payload)/api/agent/oauth/revoke/route";
import { POST as tokenPost } from "@/app/(payload)/api/agent/oauth/token/route";

const previous = process.env.AGENT_GATEWAY_ENABLED;
delete process.env.AGENT_GATEWAY_ENABLED;

try {
  const request = () => new Request("http://localhost:3000/api/agent/disabled", { method: "POST" });
  const responses = await Promise.all([
    authorizationMetadata(),
    protectedResourceMetadata(),
    mcpGet(request()),
    mcpPost(request()),
    mcpDelete(request()),
    authorizeGet(request()),
    authorizePost(request()),
    registerPost(request()),
    tokenPost(request()),
    revokePost(request()),
  ]);
  for (const response of responses) {
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }

  process.env.AGENT_GATEWAY_ENABLED = "true";
  assert.equal((await authorizationMetadata()).status, 200);
  assert.equal((await protectedResourceMetadata()).status, 200);
} finally {
  if (previous === undefined) delete process.env.AGENT_GATEWAY_ENABLED;
  else process.env.AGENT_GATEWAY_ENABLED = previous;
}

console.log("Agent route availability tests PASS.");
