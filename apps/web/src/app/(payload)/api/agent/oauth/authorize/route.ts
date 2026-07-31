import config from "@payload-config";
import { getPayload } from "payload";

import { agentGatewayDisabledResponse } from "@/agent/availability";
import { handleAuthorizeGet, handleAuthorizePost } from "@/agent/oauth-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function environment() {
  return {
    origin: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000",
    secret: process.env.PAYLOAD_SECRET ?? "",
  };
}

export async function GET(request: Request) {
  const disabled = agentGatewayDisabledResponse();
  if (disabled) return disabled;
  const { origin, secret } = environment();
  return handleAuthorizeGet(request, await getPayload({ config }), origin, secret);
}

export async function POST(request: Request) {
  const disabled = agentGatewayDisabledResponse();
  if (disabled) return disabled;
  const { origin, secret } = environment();
  return handleAuthorizePost(request, await getPayload({ config }), origin, secret);
}
