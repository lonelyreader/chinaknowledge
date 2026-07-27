import assert from "node:assert/strict";

process.env.APP_ENV = "preview";
process.env.BLOB_READ_WRITE_TOKEN = [
  "vercel",
  "blob",
  "rw",
  "fixture",
  "staticvalidation",
].join("_");
process.env.CMS_READ_MODE = "cms";
process.env.DATABASE_URL = "postgresql://example.test/china_in_fact";
process.env.PAYLOAD_SECRET = "fictional-preview-secret-at-least-32-characters";
process.env.VERCEL_ENV = "preview";

const { default: configPromise } = await import("@payload-config");
const config = await configPromise;
const media = config.collections?.find((collection) => collection.slug === "media");

assert.ok(media, "The media collection must exist.");
assert.equal(typeof media.upload, "object");
assert.equal(media.upload && typeof media.upload === "object" && media.upload.disableLocalStorage, true);
assert.equal(
  media.fields.some((field) => "name" in field && field.name === "prefix"),
  false,
  "Blob storage must not create preview-only database fields.",
);

console.log("Preview storage configuration PASS.");
