import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const migrationPath = path.resolve(process.cwd(), "src/migrations/20260730_181300.ts");
const snapshotPath = path.resolve(process.cwd(), "src/migrations/20260730_181300.json");
const typesPath = path.resolve(process.cwd(), "src/payload-types.ts");
const [migration, snapshotText, generatedTypes] = await Promise.all([
  readFile(migrationPath, "utf8"),
  readFile(snapshotPath, "utf8"),
  readFile(typesPath, "utf8"),
]);

const snapshot = JSON.parse(snapshotText) as {
  enums: Record<string, { values: string[] }>;
  tables: Record<string, { columns: Record<string, { notNull: boolean; type: string }> }>;
};

for (const table of ["public.agent_oauth_clients", "public.agent_connections", "public.agent_events"]) {
  assert.ok(snapshot.tables[table], `${table} must exist in the migration snapshot.`);
}
assert.equal(snapshot.tables["public.agent_oauth_clients"]!.columns.expires_at?.notNull, false);
assert.equal(snapshot.tables["public.agent_events"]!.columns.idempotency_digest?.type, "varchar");
assert.equal(snapshot.tables["public.agent_events"]!.columns.input_fingerprint?.type, "varchar");
assert.deepEqual(snapshot.enums["public.enum_agent_events_result"]?.values, [
  "pending",
  "success",
  "denied",
  "conflict",
  "failed",
]);

assert.match(migration, /CREATE TABLE "agent_oauth_clients"/);
assert.match(migration, /CREATE TABLE "agent_connections"/);
assert.match(migration, /CREATE TABLE "agent_events"/);
assert.match(migration, /"input_fingerprint" varchar/);
assert.match(migration, /CREATE UNIQUE INDEX "agent_events_idempotency_digest_idx"/);
assert.doesNotMatch(migration, /ALTER TABLE "people"/);
assert.doesNotMatch(migration, /ALTER TABLE "articles"/);
assert.match(generatedTypes, /inputFingerprint\?: string \| null/);
assert.match(generatedTypes, /'pending' \| 'success' \| 'denied' \| 'conflict' \| 'failed'/);

console.log("Agent schema contract tests PASS.");
