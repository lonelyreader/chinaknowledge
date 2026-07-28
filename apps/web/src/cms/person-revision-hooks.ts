import { sql } from "@payloadcms/db-postgres";
import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  PayloadRequest,
} from "payload";
import { APIError } from "payload";

import { hasEditorialRole, isCMSUser } from "./roles";

type Relation = number | string | { id: number | string } | null | undefined;

type Link = { id?: string | null; label?: string | null; url?: string | null };

type RevisionShape = {
  appliedAt?: string | null;
  editorNote?: string | null;
  id: number | string;
  openPersonKey?: string | null;
  person?: Relation;
  proposedCity?: string | null;
  proposedIdentity?: string | null;
  proposedIntroduction?: string | null;
  proposedLanguages?: ("en" | "es")[] | null;
  proposedLinks?: Link[] | null;
  proposedPortrait?: Relation;
  proposedTopics?: Relation[] | null;
  proposer?: Relation;
  reviewedAt?: string | null;
  reviewer?: Relation;
  status?: "draft" | "submitted" | "changes_requested" | "applied";
  submittedAt?: string | null;
  updatedAt?: string | null;
};

function relationID(value: Relation) {
  if (value && typeof value === "object") return value.id;
  return value;
}

function relationIDs(values: Relation[] | null | undefined) {
  return values?.map(relationID).filter((value): value is number | string => value != null) ?? [];
}

function validateLinks(links: Link[] | null | undefined) {
  for (const link of links ?? []) {
    try {
      const url = new URL(link.url ?? "");
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Unsafe protocol");
    } catch {
      throw new APIError("Profile links must use a valid http or https URL.", 400);
    }
  }
}

type LockedRevision = {
  status: RevisionShape["status"];
  updated_at: Date | string;
};

async function lockCurrentRevision(req: PayloadRequest, id: Relation) {
  const transactionID = await req.transactionID;
  const db = transactionID
    ? (req.payload.db.sessions?.[String(transactionID)]?.db as
        | { execute: (query: unknown) => Promise<{ rows?: LockedRevision[] }> }
        | undefined)
    : undefined;
  if (!db) throw new APIError("Profile revision transaction is unavailable.", 503);

  const result = await db.execute(sql`
    SELECT status, updated_at
    FROM person_revisions
    WHERE id = ${Number(relationID(id))}
    FOR UPDATE
  `);
  const row = result.rows?.[0];
  if (!row) throw new APIError("Profile revision no longer exists.", 409);
  return row;
}

export const preparePersonRevision: CollectionBeforeValidateHook<RevisionShape> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data || !isCMSUser(req.user)) return data;

  if (operation === "create") {
    if (req.user.role !== "author") {
      throw new APIError("Only authors create profile revisions.", 403);
    }
    const personResult = await req.payload.find({
      collection: "people",
      depth: 1,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: { user: { equals: req.user.id } },
    });
    const person = personResult.docs[0];
    if (!person) throw new APIError("An author profile is required.", 400);

    const openRevision = await req.payload.find({
      collection: "person-revisions",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        and: [
          { person: { equals: person.id } },
          { status: { in: ["draft", "submitted", "changes_requested"] } },
        ],
      },
    });
    if (openRevision.docs.length) {
      throw new APIError("This profile already has an open revision.", 409);
    }

    data.person = person.id;
    data.openPersonKey = String(person.id);
    data.proposer = req.user.id;
    data.status = "draft";
    data.proposedIdentity ??= person.identity;
    data.proposedIntroduction ??= person.introduction;
    data.proposedCity ??= person.city;
    data.proposedLanguages ??= person.languages;
    data.proposedPortrait ??= relationID(person.portrait);
    data.proposedTopics ??= relationIDs(person.topics as Relation[] | null | undefined);
    data.proposedLinks ??= person.links ?? [];
  } else if (originalDoc) {
    data.person = relationID(originalDoc.person);
    data.proposer = relationID(originalDoc.proposer);
  }

  return data;
};

export const enforcePersonRevisionWorkflow: CollectionBeforeChangeHook<RevisionShape> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data || !isCMSUser(req.user)) throw new APIError("Authentication is required.", 401);
  if (operation === "create") return data;
  if (!originalDoc) return data;

  const locked = await lockCurrentRevision(req, originalDoc.id);
  if (
    !originalDoc.updatedAt ||
    locked.status !== originalDoc.status ||
    new Date(locked.updated_at).getTime() !== new Date(originalDoc.updatedAt).getTime()
  ) {
    throw new APIError("Profile revision changed while this update was waiting. Reload and retry.", 409);
  }

  const current = originalDoc.status ?? "draft";
  const next = data.status ?? current;
  const editorial = hasEditorialRole(req.user);
  data.openPersonKey = next === "applied" ? null : (originalDoc.openPersonKey ?? String(relationID(originalDoc.person)));

  if (!editorial) {
    if (relationID(originalDoc.proposer) !== req.user.id) {
      throw new APIError("Authors can only update their own profile revision.", 403);
    }
    if (current !== "draft" && current !== "changes_requested") {
      throw new APIError("This profile revision is read-only.", 403);
    }
    if (next !== "draft" && next !== "submitted") {
      throw new APIError("Authors can only save or submit a profile revision.", 403);
    }
  } else {
    const allowed =
      next === current ||
      (current === "submitted" && (next === "changes_requested" || next === "applied"));
    if (!allowed) throw new APIError("This profile revision transition is not allowed.", 400);
  }

  if (next === "submitted" || next === "applied") {
    const proposed = { ...originalDoc, ...data };
    if (!proposed.proposedIdentity || !proposed.proposedIntroduction || !proposed.proposedCity) {
      throw new APIError("Identity, introduction and city are required.", 400);
    }
    if (!proposed.proposedLanguages?.length) {
      throw new APIError("At least one language is required.", 400);
    }
    validateLinks(proposed.proposedLinks);
  }

  if (next === "submitted" && current !== "submitted") {
    data.submittedAt = new Date().toISOString();
  }
  if (next === "changes_requested") {
    data.reviewedAt = new Date().toISOString();
    data.reviewer = req.user.id;
  }
  if (next === "applied") {
    if (!editorial || current !== "submitted") {
      throw new APIError("Only an editor can apply a submitted profile revision.", 403);
    }
    const personID = relationID(originalDoc.person);
    if (!personID) throw new APIError("The profile revision has no person.", 400);
    const proposed = { ...originalDoc, ...data };
    await req.payload.update({
      collection: "people",
      id: personID,
      data: {
        city: proposed.proposedCity!,
        identity: proposed.proposedIdentity!,
        introduction: proposed.proposedIntroduction!,
        languages: proposed.proposedLanguages!,
        links: proposed.proposedLinks?.map(({ label, url }) => ({ label: label!, url: url! })) ?? [],
        portrait: proposed.proposedPortrait ? Number(relationID(proposed.proposedPortrait)) : null,
        topics: relationIDs(proposed.proposedTopics).map(Number),
      },
      overrideAccess: false,
      req,
      user: req.user,
    });
    const now = new Date().toISOString();
    data.appliedAt = now;
    data.reviewedAt = now;
    data.reviewer = req.user.id;
  }

  return data;
};
