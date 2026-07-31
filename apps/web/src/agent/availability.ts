type EnvironmentSource = Record<string, string | undefined>;

export function agentGatewayEnabled(env: EnvironmentSource = process.env) {
  return env.AGENT_GATEWAY_ENABLED === "true";
}

export function agentGatewayDisabledResponse(env: EnvironmentSource = process.env) {
  return agentGatewayEnabled(env)
    ? null
    : Response.json(
        { error: "Not found" },
        { headers: { "Cache-Control": "no-store" }, status: 404 },
      );
}
