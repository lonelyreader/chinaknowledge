import config from "@payload-config";
import { getPayload } from "payload";

import { handleAgentAccessGet, handleAgentAccessPost } from "@/agent/access-route";
import { agentGatewayEnabled } from "@/agent/availability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000";
  return handleAgentAccessGet(request, await getPayload({ config }), origin, agentGatewayEnabled());
}

export async function POST(request: Request) {
  const origin = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000";
  return handleAgentAccessPost(request, await getPayload({ config }), origin);
}
