import { createHash } from "node:crypto";
import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";

import { hasEditorialRole, isCMSUser } from "./roles";

type EditorialMasterShape = {
  batchId?: string | null;
  bodyZh?: unknown;
  contentHash?: string | null;
  contentKey?: string | null;
  createdBy?: unknown;
  purpose?: unknown;
  reviewedAt?: string | null;
  reviewedBy?: unknown;
  rightsStatus?: "pending" | "cleared" | "restricted" | null;
  sourceNotes?: Array<{
    capturedAt?: string | null;
    checkedAt?: string | null;
    check?: string | null;
    label?: string | null;
    rights?: "official" | "permission" | "factual_reference" | "human_reference" | "restricted" | null;
    url?: string | null;
  }> | null;
  editorialStatus?: "candidate" | "in_review" | "approved" | "translated" | "released" | null;
  summaryZh?: string | null;
  titleZh?: string | null;
  id: number | string;
};

const approvedStatuses = new Set(["approved", "translated", "released"]);

function slugify(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function editorialMasterContentHash(value: Partial<EditorialMasterShape>) {
  return createHash("sha256")
    .update(JSON.stringify({
      bodyZh: richTextPlainText(value.bodyZh),
      purpose: relationID(value.purpose),
      sourceNotes: (value.sourceNotes ?? []).map((source) => ({
        capturedAt: canonicalDate(source.capturedAt),
        checkedAt: canonicalDate(source.checkedAt),
        check: source.check ?? null,
        label: source.label ?? "",
        rights: source.rights ?? null,
        url: source.url ?? "",
      })),
      summaryZh: value.summaryZh ?? "",
      titleZh: value.titleZh ?? "",
    }))
    .digest("hex");
}

function canonicalDate(value: string | null | undefined) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? value : new Date(time).toISOString();
}

function relationID(value: unknown) {
  if (value && typeof value === "object") {
    if ("id" in value) return (value as { id?: unknown }).id ?? null;
    if ("value" in value) return relationID((value as { value?: unknown }).value);
  }
  return value ?? null;
}

function richTextPlainText(value: unknown): string {
  const parts: string[] = [];
  const visit = (node: unknown) => {
    if (typeof node === "string") return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    if (typeof record.text === "string") parts.push(record.text);
    if (Array.isArray(record.children)) {
      for (const child of record.children) visit(child);
      if (record.type === "paragraph" || record.type === "heading") parts.push("\n");
    }
    if (record.root) visit(record.root);
  };
  visit(value);
  return parts.join("").replace(/\n{2,}/g, "\n").trim();
}

export const prepareEditorialMaster: CollectionBeforeValidateHook<EditorialMasterShape> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data;
  if (!isCMSUser(req.user) || !hasEditorialRole(req.user)) {
    throw new APIError("Editor access is required.", 403);
  }
  if (operation === "create") {
    data.editorialStatus ||= "candidate";
    data.rightsStatus ||= "pending";
    data.createdBy = req.user.id;
    data.batchId ||= "manual";
  }
  if (!data.contentKey && !originalDoc?.contentKey && data.titleZh?.trim()) {
    data.contentKey = slugify(data.titleZh) || `master-${Date.now()}`;
  }
  const merged = { ...originalDoc, ...data } as EditorialMasterShape;
  data.contentHash = editorialMasterContentHash(merged);
  return data;
};

export const enforceEditorialMaster: CollectionBeforeChangeHook<EditorialMasterShape> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!isCMSUser(req.user) || !hasEditorialRole(req.user)) {
    throw new APIError("Editor access is required.", 403);
  }
  if (operation === "update" && originalDoc?.contentKey && data.contentKey !== undefined && data.contentKey !== originalDoc.contentKey) {
    throw new APIError("The editorial master key cannot be changed.", 403);
  }
  const merged = { ...originalDoc, ...data } as EditorialMasterShape;
  data.contentHash = editorialMasterContentHash(merged);
  if (approvedStatuses.has(merged.editorialStatus ?? "candidate")) {
    if (!merged.titleZh?.trim() || !merged.summaryZh?.trim() || !merged.bodyZh || !merged.purpose) {
      throw new APIError("Chinese title, summary, body, and purpose are required before approval.", 400);
    }
    if (merged.rightsStatus !== "cleared") {
      throw new APIError("Source rights must be cleared before approval.", 400);
    }
    if (!merged.sourceNotes?.length) {
      throw new APIError("At least one checked source is required before approval.", 400);
    }
    for (const source of merged.sourceNotes) {
      if (!source.label?.trim() || !source.url?.trim() || !source.checkedAt) {
        throw new APIError("Every source requires a label, URL, and verification time.", 400);
      }
      try {
        const url = new URL(source.url);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsafe protocol");
      } catch {
        throw new APIError("Source links must use a valid http or https URL.", 400);
      }
      if (!source.rights || source.rights === "restricted") {
        throw new APIError("Restricted or unchecked sources cannot support an approved master.", 400);
      }
    }
    data.reviewedBy ||= originalDoc?.reviewedBy ?? req.user.id;
    data.reviewedAt ||= originalDoc?.reviewedAt ?? new Date().toISOString();
  }
  return data;
};
