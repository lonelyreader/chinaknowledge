import { agentGatewayDisabledResponse } from "@/agent/availability";
import { createAgentGateway } from "@/agent/gateway";
import { createPayloadAgentTokenVerifier } from "@/agent/tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function handler() {
  const origin = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000";
  return createAgentGateway({ origin, verifier: createPayloadAgentTokenVerifier(origin) });
}

export async function GET(request: Request) {
  const disabled = agentGatewayDisabledResponse();
  if (disabled) return disabled;
  return handler()(request);
}

export async function POST(request: Request) {
  const disabled = agentGatewayDisabledResponse();
  if (disabled) return disabled;
  return handler()(request);
}

export async function DELETE(request: Request) {
  const disabled = agentGatewayDisabledResponse();
  if (disabled) return disabled;
  return handler()(request);
}
