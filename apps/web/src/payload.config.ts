import "dotenv/config";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import {
  AlignFeature,
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  ChecklistFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  RelationshipFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
} from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { enTranslations } from "@payloadcms/translations/languages/en";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Block } from "payload";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Articles, extractYouTubeVideoID } from "@/collections/Articles";
import { AgentConnections } from "@/collections/AgentConnections";
import { AgentEvents } from "@/collections/AgentEvents";
import { AgentOAuthClients } from "@/collections/AgentOAuthClients";
import { EditorialMasters } from "@/collections/EditorialMasters";
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
import { uniqueVercelBlobClientUploadPlugin } from "@/cms/media-upload-filename";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEnvironment = validateServerEnvironment();

/*
 * INFRA-BODY-MEDIA-001: the only embed allowed in rich text. The url field
 * validate runs server-side on every validated write; the beforeValidate
 * guards in Articles/EditorialMasters additionally cover draft autosaves
 * (versions.drafts.validate is false) and raw API writes.
 */
const youTubeEmbedBlock: Block = {
  slug: "youtubeEmbed",
  interfaceName: "YouTubeEmbedBlock",
  labels: { singular: "YouTube video", plural: "YouTube videos" },
  fields: [
    {
      name: "url",
      type: "text",
      label: "YouTube URL",
      required: true,
      validate: (value: null | string | undefined) =>
        extractYouTubeVideoID(value)
          ? true
          : "Only YouTube video links (youtube.com / youtu.be) are supported.",
    },
    { name: "caption", type: "text", label: "Caption" },
  ],
};

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: { titleSuffix: " — China, in Fact" },
    routes: {
      reset: "/payload-reset",
    },
    components: {
      beforeNavLinks: ["/cms/components/AdminNav#AdminNavLinks"],
      graphics: {
        Icon: "/cms/components/Brand#AdminIcon",
        Logo: "/cms/components/Brand#AdminLogo",
      },
      views: {
        passwordSetup: {
          Component: "/cms/views/PasswordSetup#PasswordSetup",
          exact: false,
          path: "/reset",
          sensitive: true,
        },
      },
    },
    dashboard: {
      defaultLayout: [{ widgetSlug: "workspace", width: "full" }],
      widgets: [
        {
          Component: "/cms/components/MemberWorkspace#WorkspaceWidget",
          label: "Workspace",
          maxWidth: "full",
          minWidth: "full",
          slug: "workspace",
        },
      ],
    },
  },
  collections: [
    Users,
    People,
    AgentOAuthClients,
    AgentConnections,
    AgentEvents,
    PersonRevisions,
    Taxonomies,
    Media,
    EditorialMasters,
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
  /*
   * INFRA-BODY-MEDIA-001: explicit feature list. Mirrors the 3.86.0 default
   * set (so existing documents keep loading and rendering unchanged) plus a
   * media-only UploadFeature with caption and the whitelisted YouTube embed.
   */
  editor: lexicalEditor({
    features: [
      BoldFeature(),
      ItalicFeature(),
      UnderlineFeature(),
      StrikethroughFeature(),
      SubscriptFeature(),
      SuperscriptFeature(),
      InlineCodeFeature(),
      ParagraphFeature(),
      HeadingFeature(),
      AlignFeature(),
      IndentFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      ChecklistFeature(),
      LinkFeature(),
      RelationshipFeature(),
      BlockquoteFeature(),
      HorizontalRuleFeature(),
      InlineToolbarFeature(),
      UploadFeature({
        enabledCollections: ["media"],
        collections: {
          media: {
            fields: [{ name: "caption", type: "text", label: "Caption" }],
          },
        },
      }),
      BlocksFeature({ blocks: [youTubeEmbedBlock] }),
    ],
  }),
  i18n: {
    translations: {
      en: {
        ...enTranslations,
        general: {
          ...enTranslations.general,
          noResultsDescription: "\u200B",
          payloadSettings: "Preferences",
          restoreAsPublished: "Restore as public",
        },
        version: {
          ...enTranslations.version,
          currentlyPublished: "Currently public",
          currentPublishedVersion: "Current public version",
          draftHasPublishedVersion: "Draft has a public version",
          previouslyPublished: "Previously public",
          published: "Public",
          revertToPublished: "Revert to public version",
        },
      },
    },
  },
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
    uniqueVercelBlobClientUploadPlugin(),
  ],
  secret: process.env.PAYLOAD_SECRET!,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
