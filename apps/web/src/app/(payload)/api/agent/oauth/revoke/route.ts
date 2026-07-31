import config from "@payload-config";
import { getPayload } from "payload";

import { agentGatewayDisabledResponse } from "@/agent/availability";
import { handleRevokePost } from "@/agent/oauth-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const disabled = agentGatewayDisabledResponse();
  if (disabled) return disabled;
  return handleRevokePost(request, await getPayload({ config }), process.env.PAYLOAD_SECRET ?? "");
}
