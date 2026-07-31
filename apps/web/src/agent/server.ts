import { McpServer, type McpRequestContext } from "@modelcontextprotocol/server";
import { z } from "zod";

import { AGENT_BODY_VERSION, agentToolDescriptions, type AgentArticleBodyV1, type AgentToolResultV1 } from "./contracts";
import { AgentMemberService } from "./service";

const emptyInput = z.object({});

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
const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), children: inlineChildrenSchema }).strict(),
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3), z.literal(4)]), children: inlineChildrenSchema }).strict(),
  z.object({ type: z.literal("quote"), children: inlineChildrenSchema }).strict(),
  z.object({
    type: z.literal("list"),
    style: z.enum(["bullet", "number"]),
    items: z.array(z.object({ children: inlineChildrenSchema }).strict()).max(500),
  }).strict(),
]);
const bodySchema = z.object({
  version: z.literal(AGENT_BODY_VERSION),
  blocks: z.array(blockSchema).max(500),
}).strict().superRefine((body, context) => {
  if (JSON.stringify(body).length > 500_000) {
    context.addIssue({ code: "custom", message: "Article body must be at most 500 KB." });
  }
}) satisfies z.ZodType<AgentArticleBodyV1>;

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

  server.registerTool("my_articles_list", { title: "My articles", description: agentToolDescriptions.my_articles_list, inputSchema: emptyInput, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async () => result(await service.myArticles()));
  server.registerTool("article_get_working_copy", { title: "Working copy", description: agentToolDescriptions.article_get_working_copy, inputSchema: z.object({ id: z.number().int().positive() }), annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async ({ id }) => result(await service.workingCopy(id)));
  server.registerTool("article_create_draft", { title: "New draft", description: agentToolDescriptions.article_create_draft, inputSchema: z.object({ title: z.string().min(1).max(240), summary: z.string().max(2000).optional(), locale: z.enum(["en", "es"]), body: bodySchema, idempotencyKey: z.string() }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.createDraft(input)));
  server.registerTool("article_save_draft", { title: "Save draft", description: agentToolDescriptions.article_save_draft, inputSchema: z.object({ id: z.number().int().positive(), title: z.string().min(1).max(240), summary: z.string().max(2000).optional(), body: bodySchema, revision: z.string(), idempotencyKey: z.string() }), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input) => result(await service.saveDraft(input)));
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

  return server;
}
