import assert from "node:assert/strict";

import {
  uniqueMediaUploadFilename,
  UNIQUE_VERCEL_BLOB_CLIENT_HANDLER,
  uniqueVercelBlobClientUploadPlugin,
  VERCEL_BLOB_CLIENT_HANDLER,
} from "@/cms/media-upload-filename";

const first = uniqueMediaUploadFilename("portrait.JPG", "11111111-1111-4111-8111-111111111111");
const second = uniqueMediaUploadFilename("portrait.JPG", "22222222-2222-4222-8222-222222222222");

assert.equal(first, "portrait-11111111-1111-4111-8111-111111111111.JPG");
assert.equal(second, "portrait-22222222-2222-4222-8222-222222222222.JPG");
assert.notEqual(first, second, "Two uploads with the same browser filename need distinct Blob keys.");
assert.equal(uniqueMediaUploadFilename("portrait", "fixture"), "portrait-fixture");
assert.equal(
  uniqueMediaUploadFilename(".portrait", "fixture"),
  "portrait-fixture",
  "A hidden extensionless name must not be reparsed by Payload as its own extension.",
);
assert.equal(uniqueMediaUploadFilename(".portrait.png", "fixture"), ".portrait-fixture.png");
assert.equal(uniqueMediaUploadFilename("folder/portrait.png", "fixture"), "portrait-fixture.png");

const plugin = uniqueVercelBlobClientUploadPlugin();
const config = plugin({
  admin: {
    components: {
      providers: [
        {
          clientProps: { extra: { addRandomSuffix: false } },
          path: VERCEL_BLOB_CLIENT_HANDLER,
        },
        "/cms/components/OtherProvider",
      ],
    },
  },
  collections: [],
  db: {} as never,
  editor: {} as never,
  secret: "fixture-secret",
});

assert.ok(!(config instanceof Promise));
const providers = config.admin?.components?.providers;
assert.equal(
  typeof providers?.[0] === "object" && providers[0] !== null && "path" in providers[0]
    ? providers[0].path
    : null,
  UNIQUE_VERCEL_BLOB_CLIENT_HANDLER,
);
assert.equal(providers?.[1], "/cms/components/OtherProvider");

console.log("Media upload filename PASS.");
