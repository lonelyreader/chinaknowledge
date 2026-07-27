import "server-only";

import type { ReactNode } from "react";

type LexicalNode = {
  children?: LexicalNode[];
  format?: number | string;
  listType?: string;
  tag?: string;
  text?: string;
  type?: string;
  url?: string;
};

function inlineText(node: LexicalNode) {
  let content: ReactNode = node.text ?? "";
  const format = typeof node.format === "number" ? node.format : 0;
  if (format & 1) content = <strong>{content}</strong>;
  if (format & 2) content = <em>{content}</em>;
  if (format & 4) content = <s>{content}</s>;
  if (format & 8) content = <u>{content}</u>;
  if (format & 16) content = <code>{content}</code>;
  if (format & 32) content = <sub>{content}</sub>;
  if (format & 64) content = <sup>{content}</sup>;
  return content;
}

function safeHref(value: string | undefined) {
  if (!value) return null;
  return /^(https?:|mailto:|\/)/.test(value) ? value : null;
}

function CMSNode({ node }: { node: LexicalNode }) {
  if (node.type === "text") return inlineText(node);
  if (node.type === "linebreak") return <br />;

  const children = node.children?.map((child, index) => (
    <CMSNode key={`${child.type ?? "node"}-${index}`} node={child} />
  ));

  switch (node.type) {
    case "root":
      return <>{children}</>;
    case "paragraph":
      return <p>{children}</p>;
    case "heading": {
      const Heading = node.tag === "h3" || node.tag === "h4" ? node.tag : "h2";
      return <Heading>{children}</Heading>;
    }
    case "quote":
      return <blockquote>{children}</blockquote>;
    case "list":
      return node.listType === "number" ? <ol>{children}</ol> : <ul>{children}</ul>;
    case "listitem":
      return <li>{children}</li>;
    case "link":
    case "autolink": {
      const href = safeHref(node.url);
      return href ? <a href={href}>{children}</a> : <>{children}</>;
    }
    default:
      return <>{children}</>;
  }
}

export function CMSRichText({ data }: { data: unknown }) {
  if (!data || typeof data !== "object" || !("root" in data)) return null;
  return <CMSNode node={(data as { root: LexicalNode }).root} />;
}
