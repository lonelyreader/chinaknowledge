/*
 * INFRA-BODY-MEDIA-002: shared walker for media references inside
 * Lexical richText JSON. Used by the Articles write guard and the
 * member publication pipeline so both sides agree on what counts
 * as a body media reference.
 */
type RichTextWalkNode = {
  children?: RichTextWalkNode[];
  relationTo?: string;
  type?: string;
  value?: unknown;
};

function uploadMediaID(node: RichTextWalkNode): number | string | null {
  if (node.type !== "upload" || node.relationTo !== "media") return null;
  const value = node.value;
  if (typeof value === "number" || (typeof value === "string" && value)) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === "number" || (typeof id === "string" && id)) return id;
  }
  return null;
}

export function collectRichTextUploadMediaIDs(value: unknown): (number | string)[] {
  const root = (value as { root?: RichTextWalkNode } | null | undefined)?.root;
  if (!root || typeof root !== "object") return [];
  const ids = new Set<number | string>();
  const stack: RichTextWalkNode[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    const id = uploadMediaID(node);
    if (id != null) ids.add(id);
    if (Array.isArray(node.children)) stack.push(...node.children);
  }
  return [...ids];
}
