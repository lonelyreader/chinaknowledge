import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { pipeline } from "node:stream/promises";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const [command, objectKey, localPath] = process.argv.slice(2);
const required = [
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BACKUP_BUCKET",
  "R2_ENDPOINT",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing required backup setting: ${name}`);
  }
}

if (!command || !objectKey) {
  throw new Error(
    "Usage: node r2-object.mjs <upload|upload-if-missing|download|head> <object-key> [local-path]",
  );
}

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  region: "auto",
});
const bucket = process.env.R2_BACKUP_BUCKET;

async function exists() {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

async function upload() {
  if (!localPath) {
    throw new Error("Upload commands require a local path.");
  }
  const file = await stat(localPath);
  await client.send(
    new PutObjectCommand({
      Body: createReadStream(localPath),
      Bucket: bucket,
      ContentLength: file.size,
      Key: objectKey,
    }),
  );
}

switch (command) {
  case "head":
    if (!(await exists())) process.exitCode = 2;
    break;
  case "upload":
    await upload();
    console.log(`Uploaded ${objectKey}`);
    break;
  case "upload-if-missing":
    if (await exists()) {
      console.log(`Kept existing ${objectKey}`);
    } else {
      await upload();
      console.log(`Uploaded ${objectKey}`);
    }
    break;
  case "download": {
    if (!localPath) {
      throw new Error("Download requires a local path.");
    }
    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
    );
    if (!response.Body) {
      throw new Error(`R2 returned an empty body for ${objectKey}.`);
    }
    await mkdir(dirname(localPath), { recursive: true });
    await pipeline(response.Body, createWriteStream(localPath));
    console.log(`Downloaded ${objectKey}`);
    break;
  }
  default:
    throw new Error(`Unknown R2 object command: ${command}`);
}
