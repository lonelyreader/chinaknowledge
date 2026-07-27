import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

import { list } from "@vercel/blob";

const outputDirectory = resolve(process.argv[2] ?? "");
const token = process.env.BLOB_READ_WRITE_TOKEN;
const capturedAt = process.env.BACKUP_CAPTURED_AT;

if (!process.argv[2] || !token || !capturedAt) {
  throw new Error(
    "Usage: BLOB_READ_WRITE_TOKEN=... BACKUP_CAPTURED_AT=... node export-production-media.mjs <output-directory>",
  );
}

const objectsDirectory = join(outputDirectory, "objects");
await mkdir(objectsDirectory, { recursive: true });

const blobs = [];
let cursor;

do {
  const page = await list({ cursor, limit: 1000, token });
  blobs.push(...page.blobs);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

const manifest = [];

for (const blob of blobs.sort((left, right) => left.url.localeCompare(right.url))) {
  const identity = createHash("sha256")
    .update(`${blob.url}\n${blob.etag}\n${blob.uploadedAt.toISOString()}`)
    .digest("hex");
  const localPath = join(objectsDirectory, identity);
  const response = await fetch(blob.downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok || !response.body) {
    throw new Error(`Unable to download ${blob.pathname}: HTTP ${response.status}`);
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(localPath));

  const checksum = createHash("sha256");
  await pipeline(createReadStream(localPath), checksum);

  manifest.push({
    backupKey: `media/objects/${identity}`,
    etag: blob.etag,
    pathname: blob.pathname,
    sha256: checksum.digest("hex"),
    size: blob.size,
    uploadedAt: blob.uploadedAt.toISOString(),
    url: blob.url,
  });
}

await writeFile(
  join(outputDirectory, "manifest.json"),
  `${JSON.stringify({ capturedAt, count: manifest.length, objects: manifest }, null, 2)}\n`,
  "utf8",
);

console.log(`Prepared ${manifest.length} production media object(s) for immutable backup.`);
