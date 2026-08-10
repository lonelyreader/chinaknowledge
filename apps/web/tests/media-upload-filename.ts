import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

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
assert.equal(uniqueMediaUploadFilename("portrait.", "fixture"), "portrait-fixture");

const { generateFileData } = await import(
  pathToFileURL(path.resolve("node_modules/payload/dist/uploads/generateFileData.js")).href
);
const imageBuffer = await sharp({
  create: {
    background: { alpha: 1, b: 60, g: 40, r: 20 },
    channels: 4,
    height: 900,
    width: 1200,
  },
}).png().toBuffer();

async function payloadFilenames(browserFilename: string, suffix: string) {
  const filename = uniqueMediaUploadFilename(browserFilename, suffix);
  const result = await generateFileData({
    collection: {
      config: {
        slug: "media",
        upload: {
          disableLocalStorage: true,
          imageSizes: [{ height: 600, name: "card", position: "centre", width: 800 }],
          staticDir: "/read-only-media-upload-fixture",
        },
      },
    },
    data: {},
    draft: false,
    isDuplicating: false,
    operation: "create",
    originalDoc: null,
    overwriteExistingFiles: false,
    req: {
      context: {},
      file: {
        clientUploadContext: {},
        data: imageBuffer,
        mimetype: "image/png",
        name: filename,
        size: imageBuffer.length,
      },
      payload: {
        config: { sharp },
        db: { findOne: async () => null },
        logger: { error: () => undefined },
      },
      query: {},
      t: (key: string) => key,
    },
    throwOnMissingFile: true,
  });

  return {
    card: result.data.sizes.card.filename as string,
    database: result.data.filename as string,
    uploaded: filename,
  };
}

const trailingDotFirst = await payloadFilenames("portrait.", "first");
const trailingDotSecond = await payloadFilenames("portrait.", "second");
assert.equal(trailingDotFirst.uploaded, trailingDotFirst.database);
assert.equal(trailingDotSecond.uploaded, trailingDotSecond.database);
assert.notEqual(trailingDotFirst.uploaded, trailingDotSecond.uploaded);
assert.notEqual(
  trailingDotFirst.card,
  trailingDotSecond.card,
  "Payload card filenames must retain the unique suffix for trailing-dot browser names.",
);

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
