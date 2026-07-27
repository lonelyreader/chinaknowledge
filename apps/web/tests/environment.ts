import assert from "node:assert/strict";

import {
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
  environment: "preview",
  indexable: false,
});

assert.throws(
  () => validateServerEnvironment({ ...preview, BLOB_READ_WRITE_TOKEN: "" }),
  /BLOB_READ_WRITE_TOKEN/,
);
assert.throws(
  () => validateServerEnvironment({ ...preview, CMS_READ_MODE: "fixtures" }),
  /CMS_READ_MODE=cms/,
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

console.log("Environment boundary tests PASS.");
