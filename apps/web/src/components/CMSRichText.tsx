import "server-only";

import Image from "next/image";
import type { ReactNode } from "react";

type LexicalNode = {
  children?: LexicalNode[];
  fields?: Record<string, unknown>;
  format?: number | string;
  listType?: string;
  relationTo?: string;
  tag?: string;
  text?: string;
  type?: string;
  url?: string;
  value?: unknown;
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

// INFRA-BODY-MEDIA-002 (F4): warn once per distinct reason per server
// process instead of on every render; capped so stored junk node types
// cannot grow the set without bound.
const warnedIgnoreReasons = new Set<string>();

function ignoreNode(reason: string) {
  if (!warnedIgnoreReasons.has(reason) && warnedIgnoreReasons.size < 100) {
    warnedIgnoreReasons.add(reason);
    console.warn(`[CMSRichText] Ignored ${reason}`);
  }
  return null;
}

function trimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/*
 * INFRA-BODY-MEDIA-001: renderer-side YouTube whitelist. Deliberately
 * duplicates the server whitelist in collections/Articles.ts so the read
 * path never trusts stored data: the iframe src is rebuilt from the
 * extracted video ID, never taken from the document.
 */
const YOUTUBE_EMBED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function extractYouTubeVideoID(rawURL: unknown): string | null {
  if (typeof rawURL !== "string") return null;
  let url: URL;
  try {
    url = new URL(rawURL.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return YOUTUBE_VIDEO_ID.test(id) ? id : null;
  }
  if (!YOUTUBE_EMBED_HOSTS.has(host)) return null;
  if (url.pathname === "/watch") {
    const id = url.searchParams.get("v") ?? "";
    return YOUTUBE_VIDEO_ID.test(id) ? id : null;
  }
  const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})$/);
  return match ? match[1] : null;
}

function UploadImage({ node }: { node: LexicalNode }) {
  if (node.relationTo !== "media") {
    return ignoreNode(`upload node for collection "${String(node.relationTo)}"`);
  }
  const media = node.value;
  if (!media || typeof media !== "object") {
    // Unpopulated value: the reader has no access to this media document.
    return ignoreNode("upload node without a readable media document");
  }
  const doc = media as { alt?: unknown; height?: unknown; url?: unknown; width?: unknown };
  const src = trimmedString(doc.url);
  if (!src || !safeHref(src)) return ignoreNode("upload node without a usable media URL");
  const caption = trimmedString(node.fields?.caption);
  const alt = trimmedString(doc.alt) ?? caption ?? "";
  const width = typeof doc.width === "number" && doc.width > 0 ? doc.width : 1600;
  const height = typeof doc.height === "number" && doc.height > 0 ? doc.height : 900;
  return (
    <figure className="rich-media-figure">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        sizes="(max-width: 767px) 100vw, 720px"
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function YouTubeEmbed({ fields }: { fields: Record<string, unknown> }) {
  const videoID = extractYouTubeVideoID(fields.url);
  if (!videoID) return ignoreNode("youtubeEmbed block without a whitelisted YouTube URL");
  const caption = trimmedString(fields.caption);
  return (
    <figure className="rich-media-figure rich-media-embed">
      <div className="rich-media-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoID}`}
          title={caption ?? "YouTube video"}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
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
    case "upload":
      return <UploadImage node={node} />;
    case "block": {
      if (node.fields?.blockType === "youtubeEmbed") return <YouTubeEmbed fields={node.fields} />;
      return ignoreNode(`block of type "${String(node.fields?.blockType)}"`);
    }
    default:
      // Never emit raw HTML or children of unknown containers.
      return ignoreNode(`unsupported node type "${String(node.type)}"`);
  }
}

export function CMSRichText({ data }: { data: unknown }) {
  if (!data || typeof data !== "object" || !("root" in data)) return null;
  return <CMSNode node={(data as { root: LexicalNode }).root} />;
}
