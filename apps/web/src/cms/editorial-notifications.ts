import { randomUUID } from "node:crypto";
import type { Payload, PayloadRequest } from "payload";
import { Resend } from "resend";

import type { Article, User, WorkflowEvent } from "@/payload-types";

export type EditorialNotificationKind = "major_edit" | "needs_recheck" | "removed" | "selected";

function relationID(value: unknown) {
  return value && typeof value === "object" && "id" in value
    ? (value as { id: number | string }).id
    : value as number | string | undefined;
}

function notificationCopy(kind: EditorialNotificationKind, title: string) {
  if (kind === "selected") return {
    subject: `Selected by China, in Fact: ${title}`,
    text: "The editorial team selected your article for site curation.",
  };
  if (kind === "major_edit") return {
    subject: `Editorial update: ${title}`,
    text: "The editorial team made a substantial update to your article.",
  };
  if (kind === "needs_recheck") return {
    subject: `Curation recheck: ${title}`,
    text: "Your public article changed and is waiting for the editorial team to confirm site distribution again.",
  };
  return {
    subject: `Removed from site selection: ${title}`,
    text: "Your article remains on your profile, but it is no longer included in the site's editorial selection.",
  };
}

export function notificationKindForCuration(status: Article["curationStatus"]): EditorialNotificationKind | null {
  if (status === "selected" || status === "needs_recheck" || status === "removed") return status;
  return null;
}

export function transactionalNotificationsEnabled() {
  return process.env.APP_ENV === "production"
    && Boolean(process.env.RESEND_TRANSACTIONAL_API_KEY)
    && Boolean(process.env.PAYLOAD_EMAIL_FROM)
    && Boolean(process.env.PAYLOAD_PUBLIC_SERVER_URL);
}

export async function deliverEditorialNotification(
  payload: Payload,
  event: Pick<WorkflowEvent, "id" | "notificationAttempts" | "notificationKey" | "notificationKind">,
  article: Pick<Article, "id" | "title">,
  recipient: Pick<User, "email">,
) {
  if (!event.notificationKey || !event.notificationKind || !transactionalNotificationsEnabled()) {
    return "not_required" as const;
  }

  const baseURL = process.env.PAYLOAD_PUBLIC_SERVER_URL!.replace(/\/$/, "");
  const copy = notificationCopy(event.notificationKind, article.title);
  const attempts = (event.notificationAttempts ?? 0) + 1;
  try {
    const resend = new Resend(process.env.RESEND_TRANSACTIONAL_API_KEY!);
    const response = await resend.emails.send({
      from: `${process.env.PAYLOAD_EMAIL_FROM_NAME || "China, in Fact"} <${process.env.PAYLOAD_EMAIL_FROM}>`,
      replyTo: process.env.EMAIL_REPLY_TO,
      subject: copy.subject,
      text: `${copy.text}\n\nOpen article: ${baseURL}/admin/collections/articles/${article.id}`,
      to: recipient.email,
    }, { idempotencyKey: event.notificationKey });
    if (response.error) throw new Error(response.error.message);
    await payload.update({
      collection: "workflow-events",
      id: event.id,
      context: { skipWorkflowEvent: true },
      data: {
        notificationAttempts: attempts,
        notificationLastError: null,
        notificationSentAt: new Date().toISOString(),
        notificationStatus: "sent",
      },
      overrideAccess: true,
    });
    return "sent" as const;
  } catch (error) {
    await payload.update({
      collection: "workflow-events",
      id: event.id,
      context: { skipWorkflowEvent: true },
      data: {
        notificationAttempts: attempts,
        notificationLastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown delivery error",
        notificationStatus: "failed",
      },
      overrideAccess: true,
    }).catch(() => undefined);
    return "failed" as const;
  }
}

export async function createEditorialNotificationEvent({
  article,
  axis = "curation",
  fromStatus,
  kind,
  req,
  toStatus,
}: {
  article: Article;
  axis?: "curation" | "publication";
  fromStatus?: WorkflowEvent["fromStatus"];
  kind: EditorialNotificationKind;
  req: PayloadRequest;
  toStatus: WorkflowEvent["toStatus"];
}) {
  const ownerID = relationID(article.owner);
  if (!ownerID) return null;
  const owner = await req.payload.findByID({
    collection: "users",
    id: ownerID,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const enabled = transactionalNotificationsEnabled();
  const event = await req.payload.create({
    collection: "workflow-events",
    context: { skipWorkflowEvent: true },
    data: {
      article: Number(article.id),
      actor: req.user ? Number(req.user.id) : undefined,
      axis,
      fromStatus,
      notificationKey: randomUUID(),
      notificationKind: kind,
      notificationRecipient: owner.email,
      notificationStatus: enabled ? "pending" : "not_required",
      occurredAt: new Date().toISOString(),
      toStatus,
    },
    overrideAccess: true,
    req,
  });
  const notificationStatus = enabled
    ? await deliverEditorialNotification(req.payload, event, article, owner)
    : "not_required";
  return { ...event, notificationStatus };
}
