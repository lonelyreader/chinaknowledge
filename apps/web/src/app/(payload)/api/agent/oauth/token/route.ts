import config from "@payload-config";
import { getPayload } from "payload";

import { agentGatewayDisabledResponse } from "@/agent/availability";
import { handleTokenPost } from "@/agent/oauth-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const disabled = agentGatewayDisabledResponse();
  if (disabled) return disabled;
  const origin = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000";
  return handleTokenPost(request, await getPayload({ config }), origin, process.env.PAYLOAD_SECRET ?? "");
}
