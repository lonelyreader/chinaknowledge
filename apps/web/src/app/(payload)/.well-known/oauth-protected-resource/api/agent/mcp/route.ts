import { agentGatewayDisabledResponse } from "@/agent/availability";
import { buildAgentProtectedResourceMetadata, metadataResponse } from "@/agent/metadata";

export const dynamic = "force-dynamic";

export async function GET() {
  const disabled = agentGatewayDisabledResponse();
  if (disabled) return disabled;
  const origin = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000";
  return metadataResponse(buildAgentProtectedResourceMetadata(origin));
}
