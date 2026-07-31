import {
  AGENT_BODY_VERSION,
  type AgentArticleBodyV1,
  type AgentBlock,
  type AgentInline,
  type AgentTextMarks,
} from "./contracts";

type LexicalNode = {
  type?: unknown;
  text?: unknown;
  format?: unknown;
  tag?: unknown;
  listType?: unknown;
  url?: unknown;
  children?: unknown;
  [key: string]: unknown;
};

const TEXT_BOLD = 1;
const TEXT_ITALIC = 2;
const TEXT_STRIKE = 4;
const TEXT_CODE = 16;
const SUPPORTED_TEXT_FORMAT = TEXT_BOLD | TEXT_ITALIC | TEXT_STRIKE | TEXT_CODE;

export class UnsupportedAgentContentError extends Error {
  constructor(readonly path: string, readonly nodeType: string) {
    super(`Unsupported rich-text node "${nodeType}" at ${path}.`);
    this.name = "UnsupportedAgentContentError";
  }
}

function record(value: unknown, path: string): LexicalNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new UnsupportedAgentContentError(path, "invalid");
  }
  return value as LexicalNode;
}

function childrenOf(node: LexicalNode, path: string) {
  if (!Array.isArray(node.children)) {
    throw new UnsupportedAgentContentError(path, String(node.type ?? "invalid"));
  }
  return node.children.map((child, index) => record(child, `${path}.children[${index}]`));
}

function marksFromFormat(format: unknown, path: string): AgentTextMarks | undefined {
  const value = typeof format === "number" ? format : 0;
  if ((value & ~SUPPORTED_TEXT_FORMAT) !== 0) {
    throw new UnsupportedAgentContentError(path, `text-format-${value}`);
  }
  const marks: AgentTextMarks = {};
  if (value & TEXT_BOLD) marks.bold = true;
  if (value & TEXT_ITALIC) marks.italic = true;
  if (value & TEXT_STRIKE) marks.strike = true;
  if (value & TEXT_CODE) marks.code = true;
  return Object.keys(marks).length > 0 ? marks : undefined;
}

function inlineFromLexical(node: LexicalNode, path: string): AgentInline {
  if (node.type === "text") {
    if (typeof node.text !== "string") {
      throw new UnsupportedAgentContentError(path, "text-without-string");
    }
    return {
      type: "text",
      text: node.text,
      ...(marksFromFormat(node.format, path) ? { marks: marksFromFormat(node.format, path) } : {}),
    };
  }
  if (node.type === "linebreak") return { type: "break" };
  if (node.type === "link") {
    if (typeof node.url !== "string" || !/^https?:\/\//i.test(node.url)) {
      throw new UnsupportedAgentContentError(path, "link-with-unsupported-url");
    }
    const children = childrenOf(node, path).map((child, index) => {
      const inline = inlineFromLexical(child, `${path}.children[${index}]`);
      if (inline.type !== "text") {
        throw new UnsupportedAgentContentError(`${path}.children[${index}]`, String(child.type));
      }
      return inline;
    });
    return { type: "link", url: node.url, children };
  }
  throw new UnsupportedAgentContentError(path, String(node.type ?? "missing"));
}

function inlineChildren(node: LexicalNode, path: string) {
  return childrenOf(node, path).map((child, index) =>
    inlineFromLexical(child, `${path}.children[${index}]`));
}

function blockFromLexical(node: LexicalNode, path: string): AgentBlock {
  if (node.type === "paragraph") return { type: "paragraph", children: inlineChildren(node, path) };
  if (node.type === "quote") return { type: "quote", children: inlineChildren(node, path) };
  if (node.type === "heading") {
    const level = node.tag === "h2" ? 2 : node.tag === "h3" ? 3 : node.tag === "h4" ? 4 : null;
    if (!level) throw new UnsupportedAgentContentError(path, `heading-${String(node.tag)}`);
    return { type: "heading", level, children: inlineChildren(node, path) };
  }
  if (node.type === "list") {
    const style = node.listType === "number" ? "number" : node.listType === "bullet" ? "bullet" : null;
    if (!style) throw new UnsupportedAgentContentError(path, `list-${String(node.listType)}`);
    const items = childrenOf(node, path).map((item, index) => {
      if (item.type !== "listitem") {
        throw new UnsupportedAgentContentError(`${path}.children[${index}]`, String(item.type));
      }
      const children = childrenOf(item, `${path}.children[${index}]`);
      if (children.length !== 1 || children[0]?.type !== "paragraph") {
        throw new UnsupportedAgentContentError(`${path}.children[${index}]`, "nested-list-item");
      }
      return { children: inlineChildren(children[0], `${path}.children[${index}].children[0]`) };
    });
    return { type: "list", style, items };
  }
  throw new UnsupportedAgentContentError(path, String(node.type ?? "missing"));
}

export function lexicalToAgentBody(value: unknown): AgentArticleBodyV1 {
  const root = record(value, "root");
  if (root.type !== "root") throw new UnsupportedAgentContentError("root", String(root.type));
  return {
    version: AGENT_BODY_VERSION,
    blocks: childrenOf(root, "root").map((node, index) =>
      blockFromLexical(node, `root.children[${index}]`)),
  };
}

function lexicalText(text: string, marks?: AgentTextMarks) {
  let format = 0;
  if (marks?.bold) format |= TEXT_BOLD;
  if (marks?.italic) format |= TEXT_ITALIC;
  if (marks?.strike) format |= TEXT_STRIKE;
  if (marks?.code) format |= TEXT_CODE;
  return { type: "text", version: 1, text, detail: 0, format, mode: "normal", style: "" };
}

function lexicalInline(inline: AgentInline): Record<string, unknown> {
  if (inline.type === "text") return lexicalText(inline.text, inline.marks);
  if (inline.type === "break") return { type: "linebreak", version: 1 };
  return {
    type: "link",
    version: 1,
    url: inline.url,
    fields: { linkType: "custom", newTab: true, url: inline.url },
    children: inline.children.map((child) => lexicalText(child.text, child.marks)),
    direction: null,
    format: "",
    indent: 0,
  };
}

function lexicalParagraph(children: AgentInline[]) {
  return {
    type: "paragraph",
    version: 1,
    children: children.map(lexicalInline),
    direction: null,
    format: "",
    indent: 0,
    textFormat: 0,
    textStyle: "",
  };
}

function lexicalBlock(block: AgentBlock): Record<string, unknown> {
  if (block.type === "paragraph") return lexicalParagraph(block.children);
  if (block.type === "heading") {
    return { ...lexicalParagraph(block.children), type: "heading", tag: `h${block.level}` };
  }
  if (block.type === "quote") {
    return { ...lexicalParagraph(block.children), type: "quote" };
  }
  return {
    type: "list",
    version: 1,
    listType: block.style,
    start: 1,
    tag: block.style === "number" ? "ol" : "ul",
    direction: null,
    format: "",
    indent: 0,
    children: block.items.map((item, index) => ({
      type: "listitem",
      version: 1,
      value: index + 1,
      checked: undefined,
      direction: null,
      format: "",
      indent: 0,
      children: [lexicalParagraph(item.children)],
    })),
  };
}

export function agentBodyToLexical(body: AgentArticleBodyV1) {
  if (body.version !== AGENT_BODY_VERSION) {
    throw new TypeError(`Unsupported article body version: ${String(body.version)}`);
  }
  return {
    root: {
      type: "root",
      version: 1,
      children: body.blocks.map(lexicalBlock),
      direction: null,
      format: "",
      indent: 0,
    },
  };
}

function escapeMarkdown(value: string) {
  return value.replace(/([\\`*_[\]<>])/g, "\\$1");
}

function inlineMarkdown(inline: AgentInline): string {
  if (inline.type === "break") return "  \n";
  if (inline.type === "link") {
    return `[${inline.children.map(inlineMarkdown).join("")}](${inline.url})`;
  }
  let value = escapeMarkdown(inline.text);
  if (inline.marks?.code) value = `\`${inline.text.replace(/`/g, "\\`")}\``;
  if (inline.marks?.bold) value = `**${value}**`;
  if (inline.marks?.italic) value = `*${value}*`;
  if (inline.marks?.strike) value = `~~${value}~~`;
  return value;
}

function childrenMarkdown(children: AgentInline[]) {
  return children.map(inlineMarkdown).join("");
}

export function agentBodyToMarkdown(body: AgentArticleBodyV1) {
  return body.blocks.map((block) => {
    if (block.type === "paragraph") return childrenMarkdown(block.children);
    if (block.type === "heading") return `${"#".repeat(block.level)} ${childrenMarkdown(block.children)}`;
    if (block.type === "quote") return `> ${childrenMarkdown(block.children)}`;
    return block.items.map((item, index) =>
      `${block.style === "number" ? `${index + 1}.` : "-"} ${childrenMarkdown(item.children)}`).join("\n");
  }).join("\n\n");
}
