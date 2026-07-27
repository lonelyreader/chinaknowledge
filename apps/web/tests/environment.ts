import assert from "node:assert/strict";

import {
  normalizePostgresConnectionString,
  resolveAppEnvironment,
  validateServerEnvironment,
} from "@/config/environment";

const base = {
  CMS_READ_MODE: "fixtures",
  DATABASE_URL: "postgresql://example.test/china_in_fact",
  PAYLOAD_SECRET: "local-secret",
};

assert.equal(resolveAppEnvironment(base), "local");
assert.deepEqual(validateServerEnvironment(base), {
  blobStorageEnabled: false,
  cmsReadMode: "fixtures",
  environment: "local",
  indexable: false,
});

const preview = {
  ...base,
  APP_ENV: "preview",
  BLOB_READ_WRITE_TOKEN: ["vercel", "blob", "rw", "fixture", "staticvalidation"].join("_"),
  CMS_READ_MODE: "cms",
  PAYLOAD_SECRET: "fictional-preview-secret-at-least-32-characters",
  VERCEL_ENV: "preview",
};
assert.deepEqual(validateServerEnvironment(preview), {
  blobStorageEnabled: true,
  cmsReadMode: "cms",
  environment: "preview",
  indexable: false,
});

assert.deepEqual(validateServerEnvironment({ ...preview, CMS_READ_MODE: "fixtures" }), {
  blobStorageEnabled: true,
  cmsReadMode: "fixtures",
  environment: "preview",
  indexable: false,
});

assert.throws(
  () => validateServerEnvironment({ ...preview, BLOB_READ_WRITE_TOKEN: "" }),
  /BLOB_READ_WRITE_TOKEN/,
);
assert.throws(
  () => validateServerEnvironment({ ...preview, CMS_READ_MODE: "invalid" }),
  /CMS_READ_MODE/,
);
assert.throws(
  () => validateServerEnvironment({ ...preview, VERCEL_ENV: "production" }),
  /conflicts with VERCEL_ENV/,
);
assert.throws(
  () => validateServerEnvironment({ ...base, APP_ENV: "production" }),
  /Production runtime is not approved/,
);
assert.throws(
  () => resolveAppEnvironment({ APP_ENV: "staging" }),
  /APP_ENV must be one of/,
);

assert.equal(
  normalizePostgresConnectionString(
    "postgresql://example.test/china_in_fact?sslmode=require&channel_binding=require",
  ),
  "postgresql://example.test/china_in_fact?sslmode=verify-full&channel_binding=require",
);
assert.equal(
  normalizePostgresConnectionString("postgresql://example.test/china_in_fact"),
  "postgresql://example.test/china_in_fact",
);

console.log("Environment boundary tests PASS.");
