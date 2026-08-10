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
const { normalizeUploadBuffers } = await import("@/cms/media-hooks");
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

const blobProvider = config.admin?.components?.providers?.find(
  (provider) =>
    typeof provider === "object" &&
    provider !== null &&
    "path" in provider &&
    provider.path === "/cms/components/UniqueVercelBlobClientUploadHandler#UniqueVercelBlobClientUploadHandler",
);
assert.ok(blobProvider && typeof blobProvider === "object" && "clientProps" in blobProvider);
assert.equal(
  (blobProvider.clientProps as { extra?: { addRandomSuffix?: boolean } }).extra?.addRandomSuffix,
  false,
  "The adapter must keep server-generated resized Blob keys stable.",
);

const shared = new SharedArrayBuffer(4);
const sharedBuffer = Buffer.from(shared);
sharedBuffer.set([1, 2, 3, 4]);
const resizedShared = new SharedArrayBuffer(2);
const resizedBuffer = Buffer.from(resizedShared);
resizedBuffer.set([5, 6]);
const request = {
  file: { data: sharedBuffer },
  payloadUploadSizes: { card: resizedBuffer },
};

normalizeUploadBuffers({ doc: {}, req: request } as never);

assert.equal(request.file.data.buffer instanceof SharedArrayBuffer, false);
assert.deepEqual([...request.file.data], [1, 2, 3, 4]);
assert.equal(request.payloadUploadSizes.card.buffer instanceof SharedArrayBuffer, false);
assert.deepEqual([...request.payloadUploadSizes.card], [5, 6]);

console.log("Preview storage configuration PASS.");
