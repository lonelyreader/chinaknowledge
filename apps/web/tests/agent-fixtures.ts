import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Payload } from "payload";

import { handleAgentAccessGet } from "@/agent/access-route";

const origin = "http://localhost:3000";
const payload = {
  async auth() {
    return { user: { accountStatus: "active", id: 5, role: "author" } };
  },
} as unknown as Payload;
const response = await handleAgentAccessGet(
  new Request(`${origin}/api/agent/access?download=codex`),
  payload,
  origin,
  true,
);
assert.equal(response.status, 200);

const codexHome = mkdtempSync(path.join(tmpdir(), "china-in-fact-codex-fixture-"));
try {
  writeFileSync(path.join(codexHome, "config.toml"), await response.text(), "utf8");
  const output = execFileSync(
    process.env.CODEX_BIN ?? "codex",
    ["mcp", "get", "china-in-fact", "--json"],
    {
      encoding: "utf8",
      env: { ...process.env, CODEX_HOME: codexHome },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const parsed = JSON.parse(output) as { transport?: { type?: string; url?: string } };
  assert.equal(parsed.transport?.type, "streamable_http");
  assert.equal(
    parsed.transport?.url,
    `${origin}/api/agent/mcp`,
  );
} finally {
  rmSync(codexHome, { force: true, recursive: true });
}

console.log("Codex fixture client-load test PASS.");
