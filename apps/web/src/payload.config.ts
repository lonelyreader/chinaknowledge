import "dotenv/config";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Articles } from "@/collections/Articles";
import { Media } from "@/collections/Media";
import { People } from "@/collections/People";
import { Taxonomies } from "@/collections/Taxonomies";
import { Users } from "@/collections/Users";
import { WorkflowEvents } from "@/collections/WorkflowEvents";
import {
  normalizePostgresConnectionString,
  validateServerEnvironment,
} from "@/config/environment";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEnvironment = validateServerEnvironment();

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: " — China, in Fact" },
  },
  collections: [Users, People, Taxonomies, Media, Articles, WorkflowEvents],
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, "migrations"),
    pool: {
      connectionString: normalizePostgresConnectionString(process.env.DATABASE_URL!),
    },
    push:
      serverEnvironment.environment === "local" &&
      process.env.NODE_ENV === "development",
  }),
  editor: lexicalEditor(),
  plugins: [
    vercelBlobStorage({
      addRandomSuffix: false,
      clientUploads: true,
      collections: { media: true },
      enabled: serverEnvironment.blobStorageEnabled,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET!,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
