import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_homepage_placement" AS ENUM('none', 'lead', 'selected');
  CREATE TYPE "public"."enum__articles_v_version_homepage_placement" AS ENUM('none', 'lead', 'selected');
  ALTER TABLE "people" ADD COLUMN "spotlight_excluded" boolean DEFAULT false;
  ALTER TABLE "people" ADD COLUMN "spotlight_pinned_until" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "homepage_placement" "enum_articles_homepage_placement" DEFAULT 'none';
  ALTER TABLE "articles" ADD COLUMN "homepage_starts_at" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "homepage_ends_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_homepage_placement" "enum__articles_v_version_homepage_placement" DEFAULT 'none';
  ALTER TABLE "_articles_v" ADD COLUMN "version_homepage_starts_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_homepage_ends_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "people" DROP COLUMN "spotlight_excluded";
  ALTER TABLE "people" DROP COLUMN "spotlight_pinned_until";
  ALTER TABLE "articles" DROP COLUMN "homepage_placement";
  ALTER TABLE "articles" DROP COLUMN "homepage_starts_at";
  ALTER TABLE "articles" DROP COLUMN "homepage_ends_at";
  ALTER TABLE "_articles_v" DROP COLUMN "version_homepage_placement";
  ALTER TABLE "_articles_v" DROP COLUMN "version_homepage_starts_at";
  ALTER TABLE "_articles_v" DROP COLUMN "version_homepage_ends_at";
  DROP TYPE "public"."enum_articles_homepage_placement";
  DROP TYPE "public"."enum__articles_v_version_homepage_placement";`)
}
