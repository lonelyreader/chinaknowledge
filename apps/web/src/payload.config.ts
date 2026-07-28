import "dotenv/config";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Articles } from "@/collections/Articles";
import { Media } from "@/collections/Media";
import { People } from "@/collections/People";
import { PersonRevisions } from "@/collections/PersonRevisions";
import { Places } from "@/collections/Places";
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
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: " — China, in Fact" },
    components: {
      beforeDashboard: ["/cms/components/MemberWorkspace#MemberWorkspace"],
    },
  },
  collections: [
    Users,
    People,
    PersonRevisions,
    Taxonomies,
    Media,
    Articles,
    Places,
    WorkflowEvents,
  ],
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
  ...(serverEnvironment.transactionalEmailEnabled
    ? {
        email: resendAdapter({
          apiKey: process.env.RESEND_TRANSACTIONAL_API_KEY!,
          defaultFromAddress: process.env.PAYLOAD_EMAIL_FROM!,
          defaultFromName: process.env.PAYLOAD_EMAIL_FROM_NAME!,
        }),
      }
    : {}),
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
