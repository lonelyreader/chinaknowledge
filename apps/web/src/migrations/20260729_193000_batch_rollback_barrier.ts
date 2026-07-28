import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT 1;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
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
      ) OR EXISTS (SELECT 1 FROM "users" WHERE "account_status" = 'paused')
      OR EXISTS (
        SELECT 1 FROM "people"
        WHERE "identity_es" IS NOT NULL OR "introduction_es" IS NOT NULL OR "city_es" IS NOT NULL
      ) OR EXISTS (
        SELECT 1 FROM "people_links"
        WHERE "type"::text <> 'personal_site' OR "label_es" IS NOT NULL
      ) OR EXISTS (
        SELECT 1 FROM "_people_v"
        WHERE "version_identity_es" IS NOT NULL OR "version_introduction_es" IS NOT NULL OR "version_city_es" IS NOT NULL
      ) OR EXISTS (
        SELECT 1 FROM "_people_v_version_links"
        WHERE "type"::text <> 'personal_site' OR "label_es" IS NOT NULL
      ) THEN
        RAISE EXCEPTION 'Cannot safely roll back the member publishing batch after new-model writes. Restore the pre-migration backup instead.';
      END IF;
    END $$;
  `)
}
