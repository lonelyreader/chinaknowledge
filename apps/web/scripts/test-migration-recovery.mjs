import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

const database = `chinaknowledge_recovery_${randomUUID().replaceAll("-", "")}`;
const databaseURL = `postgresql://chinaknowledge@127.0.0.1:54329/${database}`;
const cwd = process.cwd();

function run(command, args, { allowFailure = false, env = process.env } = {}) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (!allowFailure && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${output}`);
  }
  return { output, status: result.status ?? 1 };
}

function databaseCommand(...args) {
  return run("docker", ["compose", "exec", "-T", "cms-db", ...args]);
}

function sql(statement) {
  return databaseCommand(
    "psql", "-U", "chinaknowledge", "-d", database, "-At", "-v", "ON_ERROR_STOP=1", "-c", statement,
  ).output.trim();
}

function migrate(...args) {
  return run("npx", ["payload", ...args], {
    env: { ...process.env, DATABASE_URL: databaseURL },
  });
}

try {
  databaseCommand("createdb", "-U", "chinaknowledge", database);
  migrate("migrate");
  migrate("migrate:down");

  databaseCommand("dropdb", "-U", "chinaknowledge", database);
  databaseCommand("createdb", "-U", "chinaknowledge", database);
  migrate("migrate");

  sql(`INSERT INTO users (role, display_name, account_status, email)
    VALUES ('author', 'Recovery fixture', 'paused', 'recovery-${randomUUID()}@test.invalid')`);
  const blocked = run("npx", ["payload", "migrate:down"], {
    allowFailure: true,
    env: { ...process.env, DATABASE_URL: databaseURL },
  });
  if (blocked.status === 0 || !blocked.output.includes("Cannot safely roll back")) {
    throw new Error(`Populated rollback was not blocked at the first migration:\n${blocked.output}`);
  }

  const assertions = sql(`SELECT
    to_regclass('public._people_v') IS NOT NULL,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_status'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'publication_status'),
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_events' AND column_name = 'notification_status'),
    to_regclass('public."translationGroup_locale_idx"') IS NOT NULL,
    (SELECT count(*) >= 10 FROM payload_migrations)`);
  if (assertions !== "t|t|t|t|t|t") {
    throw new Error(`Rollback guard left the schema or migration ledger incomplete: ${assertions}`);
  }

  console.log("Migration recovery PASS: clean rollback/rebuild and populated fail-closed guard verified.");
} finally {
  run("docker", ["compose", "exec", "-T", "cms-db", "dropdb", "--if-exists", "-U", "chinaknowledge", database], {
    allowFailure: true,
  });
}
