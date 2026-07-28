import "dotenv/config";

import { getPayload } from "payload";

import config from "@payload-config";
import { deliverEditorialNotification } from "../src/cms/editorial-notifications";
import { requireCMSOperationTarget } from "./cms-operation-target";

const apply = process.argv.includes("--apply");
requireCMSOperationTarget({
  apply,
  productionConfirmation: "RETRY_EDITORIAL_NOTIFICATIONS_IN_PRODUCTION",
  productionConfirmationVariable: "CMS_NOTIFICATION_RETRY_PRODUCTION_CONFIRM",
});
if (apply && process.env.CMS_NOTIFICATION_RETRY_CONFIRM !== "RETRY_EDITORIAL_NOTIFICATIONS") {
  throw new Error("Set CMS_NOTIFICATION_RETRY_CONFIRM=RETRY_EDITORIAL_NOTIFICATIONS before --apply.");
}

const payload = await getPayload({ config });
try {
  const events = await payload.find({
    collection: "workflow-events",
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: "occurredAt",
    where: {
      and: [
        { notificationKind: { exists: true } },
        { notificationRecipient: { exists: true } },
        { notificationStatus: { in: ["failed", "pending"] } },
      ],
    },
  });
  if (!apply) {
    console.log(JSON.stringify({ apply: false, retryable: events.totalDocs }, null, 2));
  } else {
    const outcomes: { event: number; status: string }[] = [];
    for (const event of events.docs) {
      const articleID = typeof event.article === "object" ? event.article.id : event.article;
      const article = await payload.findByID({
        collection: "articles",
        id: articleID,
        depth: 0,
        draft: true,
        overrideAccess: true,
      });
      const status = await deliverEditorialNotification(
        payload,
        event,
        article,
        { email: event.notificationRecipient! },
      );
      outcomes.push({ event: event.id, status });
    }
    console.log(JSON.stringify({ apply: true, outcomes }, null, 2));
    if (outcomes.some(({ status }) => status === "failed")) process.exitCode = 1;
  }
} finally {
  await payload.destroy();
}
