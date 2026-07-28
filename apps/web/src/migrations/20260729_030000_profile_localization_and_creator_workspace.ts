import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_people_links_type" AS ENUM('personal_site', 'newsletter', 'youtube', 'linkedin', 'x', 'instagram', 'github', 'email', 'other');
    CREATE TYPE "public"."enum__people_v_version_links_type" AS ENUM('personal_site', 'newsletter', 'youtube', 'linkedin', 'x', 'instagram', 'github', 'email', 'other');

    ALTER TABLE "people"
      ADD COLUMN "identity_es" varchar,
      ADD COLUMN "introduction_es" varchar,
      ADD COLUMN "city_es" varchar;
    ALTER TABLE "people_links"
      ADD COLUMN "type" "enum_people_links_type" DEFAULT 'personal_site' NOT NULL,
      ADD COLUMN "label_es" varchar;

    ALTER TABLE "_people_v"
      ADD COLUMN "version_identity_es" varchar,
      ADD COLUMN "version_introduction_es" varchar,
      ADD COLUMN "version_city_es" varchar;
    ALTER TABLE "_people_v_version_links"
      ADD COLUMN "type" "enum__people_v_version_links_type" DEFAULT 'personal_site' NOT NULL,
      ADD COLUMN "label_es" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
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
        RAISE EXCEPTION 'Cannot safely roll back localized profiles or typed links after new-model writes. Restore the pre-migration backup instead.';
      END IF;
    END $$;

    ALTER TABLE "_people_v_version_links" DROP COLUMN "type", DROP COLUMN "label_es";
    ALTER TABLE "_people_v" DROP COLUMN "version_identity_es", DROP COLUMN "version_introduction_es", DROP COLUMN "version_city_es";
    ALTER TABLE "people_links" DROP COLUMN "type", DROP COLUMN "label_es";
    ALTER TABLE "people" DROP COLUMN "identity_es", DROP COLUMN "introduction_es", DROP COLUMN "city_es";
    DROP TYPE "public"."enum__people_v_version_links_type";
    DROP TYPE "public"."enum_people_links_type";
  `)
}
