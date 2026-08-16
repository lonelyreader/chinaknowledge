import { McpServer, type McpRequestContext } from "@modelcontextprotocol/server";
import { z } from "zod";

import { AGENT_BODY_V2_VERSION, AGENT_BODY_VERSION, agentToolDescriptions, type AgentArticleBody, type AgentArticleBodyV1, type AgentArticleBodyV2, type AgentToolResultV1 } from "./contracts";
import { AgentMemberService } from "./service";

const emptyInput = z.object({}).strict();
const paginationSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(50).optional(),
}).strict();
const optionalProfileText = z.string().max(10_000).nullable().optional();
const canHelpWithSchema = z.array(z.string().min(1).max(500)).max(8);
const profilePatchSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  nameZh: z.string().max(500).nullable().optional(),
  portraitId: z.number().int().positive().nullable().optional(),
  languages: z.array(z.enum(["en", "es"])).max(2).refine((values) => new Set(values).size === values.length).optional(),
  topicIds: z.array(z.number().int().positive()).max(50).refine((values) => new Set(values).size === values.length).optional(),
  identity: optionalProfileText,
  city: optionalProfileText,
  introduction: optionalProfileText,
  quote: optionalProfileText,
  canHelpWith: canHelpWithSchema.optional(),
  identityEs: optionalProfileText,
  cityEs: optionalProfileText,
  introductionEs: optionalProfileText,
  quoteEs: optionalProfileText,
  canHelpWithEs: canHelpWithSchema.optional(),
  revision: z.string(),
  idempotencyKey: z.string(),
}).strict().refine((value) => Object.keys(value).some((key) => key !== "revision" && key !== "idempotencyKey"), {
  message: "At least one profile field is required.",
});
const profileLinkSchema = z.object({
  type: z.enum(["personal_site", "newsletter", "youtube", "linkedin", "x", "instagram", "github", "discord", "email", "other"]),
  label: z.string().min(1).max(500),
  labelEs: z.string().max(500).nullable().optional(),
  url: z.string().min(1).max(2_048),
}).strict().superRefine((link, context) => {
  const valid = link.type === "email"
    ? /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(link.url)
    : /^https?:\/\//i.test(link.url);
  if (!valid) context.addIssue({ code: "custom", message: link.type === "email" ? "Email links must use mailto:." : "Links must use http:// or https://." });
});

const marksSchema = z.object({
  bold: z.literal(true).optional(),
  code: z.literal(true).optional(),
  italic: z.literal(true).optional(),
  strike: z.literal(true).optional(),
}).strict();
const textSchema = z.object({
  type: z.literal("text"),
  text: z.string().max(20_000),
  marks: marksSchema.optional(),
}).strict();
const inlineSchema = z.discriminatedUnion("type", [
  textSchema,
  z.object({
    type: z.literal("link"),
    url: z.url().max(2_048).refine((value) => value.startsWith("https://") || value.startsWith("http://")),
    children: z.array(textSchema).max(200),
  }).strict(),
  z.object({ type: z.literal("break") }).strict(),
]);
const inlineChildrenSchema = z.array(inlineSchema).max(1_000);
const paragraphSchema = z.object({ type: z.literal("paragraph"), children: inlineChildrenSchema }).strict();
const headingSchema = z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3), z.literal(4)]), children: inlineChildrenSchema }).strict();
const quoteSchema = z.object({ type: z.literal("quote"), children: inlineChildrenSchema }).strict();
const listSchema = z.object({
  type: z.literal("list"),
  style: z.enum(["bullet", "number"]),
  items: z.array(z.object({ children: inlineChildrenSchema }).strict()).max(500),
}).strict();
const blockSchema = z.discriminatedUnion("type", [paragraphSchema, headingSchema, quoteSchema, listSchema]);
const imageBlockSchema = z.object({
  type: z.literal("image"),
  mediaId: z.number().int().positive(),
  alt: z.string().min(1).max(2_000),
  caption: z.string().min(1).max(2_000).optional(),
}).strict();
const youtubeBlockSchema = z.object({
  type: z.literal("youtube"),
  url: z.url().max(2_048),
  caption: z.string().min(1).max(2_000).optional(),
}).strict();
const blockV2Schema = z.discriminatedUnion("type", [paragraphSchema, headingSchema, quoteSchema, listSchema, imageBlockSchema, youtubeBlockSchema]);
const bodySizeLimit = (body: unknown, context: z.RefinementCtx) => {
  if (JSON.stringify(body).length > 500_000) {
    context.addIssue({ code: "custom", message: "Article body must be at most 500 KB." });
  }
};
const bodySchema = z.object({
  version: z.literal(AGENT_BODY_VERSION),
  blocks: z.array(blockSchema).max(500),
}).strict().superRefine(bodySizeLimit) satisfies z.ZodType<AgentArticleBodyV1>;
const bodyV2Schema = z.object({
  version: z.literal(AGENT_BODY_V2_VERSION),
  blocks: z.array(blockV2Schema).max(500),
}).strict().superRefine(bodySizeLimit) satisfies z.ZodType<AgentArticleBodyV2>;
const anyBodySchema = z.union([bodySchema, bodyV2Schema]) satisfies z.ZodType<AgentArticleBody>;
const editorialSourceSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  label: z.string().min(1).max(500),
  url: z.url().max(2_048).refine((value) => value.startsWith("https://") || value.startsWith("http://")).nullable().optional(),
  checkedAt: z.iso.datetime({ offset: true }).nullable().optional(),
  check: z.string().max(10_000).nullable().optional(),
}).strict();
const editorialCommentSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  anchor: z.string().min(1).max(500),
  message: z.string().min(1).max(10_000),
  resolved: z.boolean().optional(),
}).strict();
const editorialSitePatchSchema = z.object({
  id: z.number().int().positive(),
  revision: z.string(),
  idempotencyKey: z.string(),
  assignedEditorId: z.number().int().positive().nullable().optional(),
  format: z.enum(["guide", "reporting", "analysis", "first_person", "update"]).nullable().optional(),
  purposeIds: z.array(z.number().int().positive()).max(50).optional(),
  topicIds: z.array(z.number().int().positive()).max(50).optional(),
  geographyIds: z.array(z.number().int().positive()).max(50).optional(),
  situationIds: z.array(z.number().int().positive()).max(50).optional(),
  sourceNotes: z.array(editorialSourceSchema).max(50).optional(),
  freshnessDate: z.union([z.iso.date(), z.iso.datetime({ offset: true })]).nullable().optional(),
  editorComments: z.array(editorialCommentSchema).max(50).optional(),
  coverImageId: z.number().int().positive().nullable().optional(),
}).strict().refine((value) => Object.keys(value).some((key) => !["id", "revision", "idempotencyKey"].includes(key)), {
  message: "At least one editorial site field is required.",
});
const homepageScheduleInputSchema = z.discriminatedUnion("placement", [
  z.object({
    id: z.number().int().positive(),
    revision: z.string(),
    placement: z.literal("none"),
    startsAt: z.null(),
    endsAt: z.null(),
  }).strict(),
  z.object({
    id: z.number().int().positive(),
    revision: z.string(),
    placement: z.enum(["lead", "selected"]),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
  }).strict(),
]);
const confirmedEditorialActionSchema = z.object({
  confirmationRef: z.string().max(2_048),
  revision: z.string(),
  idempotencyKey: z.string(),
}).strict();

function result(value: AgentToolResultV1<unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value,
    isError: !value.ok,
  };
}

export async function createAgentMcpServer(context: McpRequestContext) {
  const server = new McpServer({ name: "china-in-fact", version: "0.1.0" });
  if (!context.authInfo) return server;
  const service = await AgentMemberService.create(context.authInfo);
  const role = await service.currentRole();
  const editorial = role === "editor" || role === "super_admin";
  const admin = role === "super_admin";

  server.registerTool("account_context", { title: "Account", description: agentToolDescriptions.account_context, inputSchema: emptyInput, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async () => result(await service.accountContext()));

  server.registerTool(
    "capabilities_list",
    {
      title: "Available actions",
      description: agentToolDescriptions.capabilities_list,
      inputSchema: emptyInput,
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async () => result(await service.capabilities()),
  );

  server.registerTool("my_profile_get", { title: "My profile", description: agentToolDescriptions.my_profile_get, inputSchema: emptyInput, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async () => result(await service.myProfileGet()));
  server.registerTool("my_profile_save", { title: "Save profile", description: agentToolDescriptions.my_profile_save, inputSchema: profilePatchSchema, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async ({ revision, idempotencyKey, ...patch }) => result(await service.myProfileSave({ revision, idempotencyKey, patch })));
  server.registerTool("my_links_save", { title: "Save profile links", description: agentToolDescriptions.my_links_save, inputSchema: z.object({ links: z.array(profileLinkSchema).max(8), revision: z.string(), idempotencyKey: z.string() }).strict(), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.myLinksSave(input)));
  server.registerTool("my_profile_prepare_publication", { title: "Prepare profile visibility", description: agentToolDescriptions.my_profile_prepare_publication, inputSchema: z.object({ targetStatus: z.enum(["draft", "public"]), revision: z.string() }).strict(), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } }, async (input) => result(await service.prepareProfilePublication(input)));
  server.registerTool("my_profile_commit_publication", { title: "Confirm profile visibility", description: agentToolDescriptions.my_profile_commit_publication, inputSchema: z.object({ confirmationRef: z.string().max(2_048), revision: z.string(), idempotencyKey: z.string() }).strict(), annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.commitProfilePublication(input)));
  server.registerTool("my_articles_list", { title: "My articles", description: agentToolDescriptions.my_articles_list, inputSchema: paginationSchema.extend({ locale: z.enum(["en", "es"]).optional(), publicationStatus: z.enum(["draft", "published", "withdrawn"]).optional() }).strict(), annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.myArticles(input)));
  server.registerTool("my_media_list", { title: "My media", description: agentToolDescriptions.my_media_list, inputSchema: paginationSchema, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.myMedia(input)));
  server.registerTool("article_get_working_copy", { title: "Working copy", description: agentToolDescriptions.article_get_working_copy, inputSchema: z.object({ id: z.number().int().positive(), bodyVersion: z.enum([AGENT_BODY_VERSION, AGENT_BODY_V2_VERSION]).optional() }), annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async ({ id, bodyVersion }) => result(await service.workingCopy(id, { bodyVersion })));
  server.registerTool("article_create_draft", { title: "New draft", description: agentToolDescriptions.article_create_draft, inputSchema: z.object({ title: z.string().min(1).max(240), summary: z.string().max(2000).optional(), locale: z.enum(["en", "es"]), body: anyBodySchema, idempotencyKey: z.string() }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.createDraft(input)));
  server.registerTool("article_create_translation_draft", { title: "Create translation draft", description: agentToolDescriptions.article_create_translation_draft, inputSchema: z.object({ id: z.number().int().positive(), idempotencyKey: z.string() }).strict(), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.createTranslationDraft(input)));
  server.registerTool("article_save_draft", { title: "Save draft", description: agentToolDescriptions.article_save_draft, inputSchema: z.object({ id: z.number().int().positive(), title: z.string().min(1).max(240), summary: z.string().max(2000).optional(), body: anyBodySchema, revision: z.string(), idempotencyKey: z.string() }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.saveDraft(input)));
  server.registerTool("media_upload", { title: "Upload image", description: agentToolDescriptions.media_upload, inputSchema: z.object({ filename: z.string().min(1).max(200), mimeType: z.string().regex(/^image\/[\w.+-]+$/), data: z.string().min(1).max(14_000_000), alt: z.string().min(1).max(2_000), idempotencyKey: z.string() }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.mediaUpload(input)));
  server.registerTool("article_set_cover", { title: "Set cover image", description: agentToolDescriptions.article_set_cover, inputSchema: z.object({ id: z.number().int().positive(), mediaId: z.number().int().positive(), revision: z.string(), idempotencyKey: z.string() }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.setCover(input)));
  server.registerTool("article_preview", { title: "Preview", description: agentToolDescriptions.article_preview, inputSchema: z.object({ id: z.number().int().positive() }), annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async ({ id }) => result(await service.preview(id)));
  server.registerTool(
    "article_prepare_publication",
    {
      title: "Prepare publication",
      description: agentToolDescriptions.article_prepare_publication,
      inputSchema: z.object({
        id: z.number().int().positive(),
        targetStatus: z.enum(["published", "withdrawn"]),
        revision: z.string(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (input) => result(await service.preparePublication(input)),
  );
  server.registerTool(
    "article_commit_publication",
    {
      title: "Confirm publication",
      description: agentToolDescriptions.article_commit_publication,
      inputSchema: z.object({
        confirmationRef: z.string().max(2_048),
        revision: z.string(),
        idempotencyKey: z.string(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => result(await service.commitPublication(input)),
  );

  if (editorial) {
    server.registerTool(
      "editorial_attention_list",
      {
        title: "Needs attention",
        description: agentToolDescriptions.editorial_attention_list,
        inputSchema: paginationSchema.extend({ locale: z.enum(["en", "es"]).optional(), assignee: z.enum(["all", "mine", "unassigned"]).optional() }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async (input) => result(await service.editorialAttentionList(input)),
    );
    server.registerTool(
      "editorial_reference_options",
      {
        title: "Editorial references",
        description: agentToolDescriptions.editorial_reference_options,
        inputSchema: paginationSchema.extend({ kind: z.enum(["assignee", "purpose", "topic", "geography", "situation", "approved_cover"]), query: z.string().max(200).optional() }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async (input) => result(await service.editorialReferenceOptions(input)),
    );
    server.registerTool(
      "editorial_article_get",
      {
        title: "Editorial article",
        description: agentToolDescriptions.editorial_article_get,
        inputSchema: z.object({ id: z.number().int().positive(), bodyVersion: z.enum([AGENT_BODY_VERSION, AGENT_BODY_V2_VERSION]).optional() }).strict(),
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ id, bodyVersion }) => result(await service.editorialArticleGet(id, { bodyVersion })),
    );
    server.registerTool(
      "editorial_save_site_fields",
      {
        title: "Save editorial fields",
        description: agentToolDescriptions.editorial_save_site_fields,
        inputSchema: editorialSitePatchSchema,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ id, revision, idempotencyKey, ...patch }) => result(await service.editorialSaveSiteFields({ id, revision, idempotencyKey, patch })),
    );
    server.registerTool(
      "editorial_prepare_site_selection",
      {
        title: "Prepare site selection",
        description: agentToolDescriptions.editorial_prepare_site_selection,
        inputSchema: z.object({
          id: z.number().int().positive(),
          targetStatus: z.enum(["curated", "removed"]),
          revision: z.string(),
        }),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      },
      async (input) => result(await service.prepareSiteSelection(input)),
    );
    server.registerTool(
      "editorial_commit_site_selection",
      {
        title: "Confirm site selection",
        description: agentToolDescriptions.editorial_commit_site_selection,
        inputSchema: z.object({
          confirmationRef: z.string().max(2_048),
          revision: z.string(),
          idempotencyKey: z.string(),
        }),
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      },
      async (input) => result(await service.commitSiteSelection(input)),
    );
    server.registerTool(
      "editorial_prepare_homepage_schedule",
      {
        title: "Prepare homepage schedule",
        description: agentToolDescriptions.editorial_prepare_homepage_schedule,
        inputSchema: homepageScheduleInputSchema,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      },
      async (input) => result(await service.prepareHomepageSchedule(input)),
    );
    server.registerTool(
      "editorial_commit_homepage_schedule",
      {
        title: "Confirm homepage schedule",
        description: agentToolDescriptions.editorial_commit_homepage_schedule,
        inputSchema: confirmedEditorialActionSchema,
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      },
      async (input) => result(await service.commitHomepageSchedule(input)),
    );
    server.registerTool(
      "editorial_prepare_major_edit_notification",
      {
        title: "Prepare author notification",
        description: agentToolDescriptions.editorial_prepare_major_edit_notification,
        inputSchema: z.object({ id: z.number().int().positive(), revision: z.string() }).strict(),
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      },
      async (input) => result(await service.prepareMajorEditNotification(input)),
    );
    server.registerTool(
      "editorial_commit_major_edit_notification",
      {
        title: "Confirm author notification",
        description: agentToolDescriptions.editorial_commit_major_edit_notification,
        inputSchema: confirmedEditorialActionSchema,
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
      },
      async (input) => result(await service.commitMajorEditNotification(input)),
    );
  }

  if (admin) {
    server.registerTool(
      "editorial_release_site_article_batch",
      {
        title: "Release site article batch",
        description: agentToolDescriptions.editorial_release_site_article_batch,
        inputSchema: z.object({
          ids: z.array(z.number().int().positive()).min(1).max(20),
          approval: z.literal("PUBLISH_AND_CURATE_SITE_ARTICLES"),
          idempotencyKey: z.string().min(16).max(80),
        }),
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      },
      async (input) => result(await service.releaseSiteArticleBatch(input)),
    );
    server.registerTool(
      "admin_recent_activity",
      {
        title: "Recent activity",
        description: agentToolDescriptions.admin_recent_activity,
        inputSchema: emptyInput,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async () => result(await service.adminRecentActivity()),
    );
  }

  return server;
}
