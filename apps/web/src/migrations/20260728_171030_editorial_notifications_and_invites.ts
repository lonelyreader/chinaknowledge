import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_workflow_events_notification_kind" AS ENUM('selected', 'major_edit', 'needs_recheck', 'removed');
  CREATE TYPE "public"."enum_workflow_events_notification_status" AS ENUM('not_required', 'pending', 'sent', 'failed');
  ALTER TABLE "workflow_events" ADD COLUMN "notification_kind" "enum_workflow_events_notification_kind";
  ALTER TABLE "workflow_events" ADD COLUMN "notification_status" "enum_workflow_events_notification_status" DEFAULT 'not_required';
  ALTER TABLE "workflow_events" ADD COLUMN "notification_key" varchar;
  ALTER TABLE "workflow_events" ADD COLUMN "notification_recipient" varchar;
  ALTER TABLE "workflow_events" ADD COLUMN "notification_attempts" numeric DEFAULT 0;
  ALTER TABLE "workflow_events" ADD COLUMN "notification_last_error" varchar;
  ALTER TABLE "workflow_events" ADD COLUMN "notification_sent_at" timestamp(3) with time zone;
  CREATE UNIQUE INDEX "workflow_events_notification_key_idx" ON "workflow_events" USING btree ("notification_key");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM "_people_v")
    OR EXISTS (
      SELECT 1 FROM "articles"
      WHERE ("publication_status"::text, "curation_status"::text) NOT IN (
        ('draft', 'not_selected'),
        ('published', 'curated'),
        ('withdrawn', 'removed')
      )
    ) OR EXISTS (
      SELECT 1 FROM "_articles_v"
      WHERE ("version_publication_status"::text, "version_curation_status"::text) NOT IN (
        ('draft', 'not_selected'),
        ('published', 'curated'),
        ('withdrawn', 'removed')
      ) OR "autosave" IS TRUE
    ) OR EXISTS (
      SELECT 1 FROM "media"
      WHERE "member_use_published_at" IS NOT NULL
        AND "public_use_approved_at" IS NULL
    ) OR EXISTS (
      SELECT 1 FROM "workflow_events"
      WHERE "axis" IS NOT NULL
        OR "notification_kind" IS NOT NULL
        OR "notification_key" IS NOT NULL
        OR "notification_recipient" IS NOT NULL
        OR "notification_attempts" > 0
        OR "notification_sent_at" IS NOT NULL
    ) OR EXISTS (
      SELECT 1 FROM "users" WHERE "account_status" = 'paused'
    ) THEN
      RAISE EXCEPTION 'Cannot safely roll back member publishing, profile history, account state, or notifications after new-model writes. Restore the pre-migration backup instead.';
    END IF;
  END $$;

  DROP INDEX "workflow_events_notification_key_idx";
  ALTER TABLE "workflow_events" DROP COLUMN "notification_kind";
  ALTER TABLE "workflow_events" DROP COLUMN "notification_status";
  ALTER TABLE "workflow_events" DROP COLUMN "notification_key";
  ALTER TABLE "workflow_events" DROP COLUMN "notification_recipient";
  ALTER TABLE "workflow_events" DROP COLUMN "notification_attempts";
  ALTER TABLE "workflow_events" DROP COLUMN "notification_last_error";
  ALTER TABLE "workflow_events" DROP COLUMN "notification_sent_at";
  DROP TYPE "public"."enum_workflow_events_notification_kind";
  DROP TYPE "public"."enum_workflow_events_notification_status";`)
}
