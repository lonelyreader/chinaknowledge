import config from "@payload-config";
import { getPayload } from "payload";

import { agentGatewayDisabledResponse } from "@/agent/availability";
import { handleRegistrationPost } from "@/agent/registration";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const disabled = agentGatewayDisabledResponse();
  if (disabled) return disabled;
  return handleRegistrationPost(request, await getPayload({ config }));
}
