import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE UNIQUE INDEX "translationGroup_locale_idx" ON "articles" USING btree ("translation_group","locale");
  CREATE INDEX "version_translationGroup_version_locale_idx" ON "_articles_v" USING btree ("version_translation_group","version_locale");`)
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
      RAISE EXCEPTION 'Cannot safely roll back member publishing, profile history, account state, notifications, or article identity after new-model writes. Restore the pre-migration backup instead.';
    END IF;
  END $$;

  DROP INDEX "translationGroup_locale_idx";
  DROP INDEX "version_translationGroup_version_locale_idx";`)
}
