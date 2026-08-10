import { APIError, type PayloadRequest } from "payload";

import type { Article } from "@/payload-types";

import { assertCurationComplete } from "./article-hooks";
import { getLatestDraftData } from "./article-publication";
import { isSuperAdmin } from "./roles";
import { assertCurationTransition, type CurationStatus } from "./workflow";

export type EditorialSiteSelectionAction = "add_to_site" | "remove_from_site";
export type EditorialSiteSelectionTarget = "curated" | "removed";

function relationID(value: unknown) {
  if (value && typeof value === "object" && "id" in value) {
    return (value as { id?: unknown }).id ?? null;
  }
  return value ?? null;
}

export function editorialSiteSelectionAction(
  current: CurationStatus,
  target: EditorialSiteSelectionTarget,
  options: { allowDirectSiteSelection?: boolean } = {},
): EditorialSiteSelectionAction {
  if (target === "curated") {
    if (options.allowDirectSiteSelection && current === "not_selected") {
      return "add_to_site";
    }
    if (current !== "selected" && current !== "editing" && current !== "needs_recheck") {
      throw new APIError("Only a selected article can be added to the site.", 403);
    }
    assertCurationTransition(current, target);
    return "add_to_site";
  }
  if (current !== "curated") {
    throw new APIError("Only a site-selected article can be removed from the site.", 403);
  }
  assertCurationTransition(current, target);
  return "remove_from_site";
}

export async function editorialCurationIssue(article: Article, req: PayloadRequest) {
  const current = article.curationStatus ?? "not_selected";
  if (article.publicationStatus !== "published") {
    return "Only a member-public article can be selected for site distribution.";
  }
  try {
    const promotable = await getLatestDraftData(req.payload, article.id, article, req, "curation");
    await assertCurationComplete({ ...article, ...promotable, curationStatus: current }, req);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Site curation requirements are incomplete.";
  }
}

export async function prepareEditorialSiteSelection(
  article: Article,
  target: EditorialSiteSelectionTarget,
  req: PayloadRequest,
) {
  const current = article.curationStatus ?? "not_selected";
  const allowDirectSiteSelection = article.authorshipType === "site" && isSuperAdmin(req.user);
  const action = editorialSiteSelectionAction(current, target, { allowDirectSiteSelection });
  if (target === "curated") {
    const promotable = await getLatestDraftData(req.payload, article.id, article, req, "curation");
    await assertCurationComplete({ ...article, ...promotable, curationStatus: target }, req);
  }
  return {
    action,
    authorId: article.authorshipType === "site" ? null : relationID(article.author),
    currentStatus: current,
    publicPath: `/${article.locale}/posts/${article.slug}`,
    siteEntryEffect: target === "curated" ? "included" as const : "removed" as const,
    targetStatus: target,
  };
}

export async function commitEditorialSiteSelection(
  article: Article,
  target: EditorialSiteSelectionTarget,
  req: PayloadRequest,
  options: { strictAgentSlice?: boolean } = {},
) {
  const current = article.curationStatus ?? "not_selected";
  const allowDirectSiteSelection = article.authorshipType === "site" && isSuperAdmin(req.user);
  if (options.strictAgentSlice) editorialSiteSelectionAction(current, target, { allowDirectSiteSelection });
  else assertCurationTransition(current, target);
  const promotedData = target === "curated"
    ? await getLatestDraftData(req.payload, article.id, article, req, "curation")
    : undefined;
  return req.payload.update({
    collection: "articles",
    id: article.id,
    context: { curationConfirmed: target === "curated" },
    data: {
      ...promotedData,
      curationStatus: target,
    },
    draft: false,
    overrideAccess: false,
    req,
  });
}
