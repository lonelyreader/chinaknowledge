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
  newsletterEnabled: false,
  transactionalEmailEnabled: false,
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
  newsletterEnabled: false,
  transactionalEmailEnabled: false,
});

assert.deepEqual(validateServerEnvironment({ ...preview, CMS_READ_MODE: "fixtures" }), {
  blobStorageEnabled: true,
  cmsReadMode: "fixtures",
  environment: "preview",
  indexable: false,
  newsletterEnabled: false,
  transactionalEmailEnabled: false,
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
const production = {
  ...preview,
  APP_ENV: "production",
  EMAIL_REPLY_TO: "hello@chinainfact.com",
  NEWSLETTER_EMAIL_FROM: "newsletter@mail.chinainfact.com",
  PAYLOAD_EMAIL_FROM: "account@mail.chinainfact.com",
  PAYLOAD_EMAIL_FROM_NAME: "China, in Fact",
  PAYLOAD_PUBLIC_SERVER_URL: "https://china-in-fact.example.test",
  PUBLIC_INDEXING_ENABLED: "false",
  RESEND_CONTACTS_API_KEY: "re_fixture_contacts_key_123456",
  RESEND_NEWSLETTER_TOPIC_ID: "c6b0f6a2-f1fa-42cf-86ab-0dba63aa7a26",
  RESEND_TRANSACTIONAL_API_KEY: "re_fixture_transactional_key_123456",
  VERCEL_ENV: "production",
};
assert.deepEqual(validateServerEnvironment(production), {
  blobStorageEnabled: true,
  cmsReadMode: "cms",
  environment: "production",
  indexable: false,
  newsletterEnabled: true,
  transactionalEmailEnabled: true,
});
assert.equal(
  validateServerEnvironment({ ...production, PUBLIC_INDEXING_ENABLED: "true" }).indexable,
  true,
);
assert.throws(
  () => validateServerEnvironment({ ...production, RESEND_CONTACTS_API_KEY: "" }),
  /RESEND_CONTACTS_API_KEY/,
);
assert.throws(
  () => validateServerEnvironment({ ...production, BLOB_READ_WRITE_TOKEN: "" }),
  /BLOB_READ_WRITE_TOKEN/,
);
assert.throws(
  () => validateServerEnvironment({ ...production, PAYLOAD_PUBLIC_SERVER_URL: "admin" }),
  /PAYLOAD_PUBLIC_SERVER_URL/,
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
