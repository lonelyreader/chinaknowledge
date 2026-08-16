import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// INFRA-PERSON-PAGE-001: additive nullable Person member-card fields only.
// Generation also surfaced a pre-existing people.slug NOT NULL drift (slug
// gained an admin condition on 2026-07-29, after the last snapshot); those
// unrelated ALTERs were deliberately excluded from this migration.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_people_links_type" ADD VALUE 'discord' BEFORE 'email';
  ALTER TYPE "public"."enum__people_v_version_links_type" ADD VALUE 'discord' BEFORE 'email';
  CREATE TABLE "people_can_help_with" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "item" varchar NOT NULL
  );

  CREATE TABLE "people_can_help_with_es" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "item" varchar NOT NULL
  );

  CREATE TABLE "_people_v_version_can_help_with" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "item" varchar NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_people_v_version_can_help_with_es" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "item" varchar NOT NULL,
    "_uuid" varchar
  );

  ALTER TABLE "people" ADD COLUMN "name_zh" varchar;
  ALTER TABLE "people" ADD COLUMN "quote" varchar;
  ALTER TABLE "people" ADD COLUMN "editorial_bio" jsonb;
  ALTER TABLE "people" ADD COLUMN "verdict" varchar;
  ALTER TABLE "people" ADD COLUMN "quote_es" varchar;
  ALTER TABLE "people" ADD COLUMN "editorial_bio_es" jsonb;
  ALTER TABLE "people" ADD COLUMN "verdict_es" varchar;
  ALTER TABLE "_people_v" ADD COLUMN "version_name_zh" varchar;
  ALTER TABLE "_people_v" ADD COLUMN "version_quote" varchar;
  ALTER TABLE "_people_v" ADD COLUMN "version_editorial_bio" jsonb;
  ALTER TABLE "_people_v" ADD COLUMN "version_verdict" varchar;
  ALTER TABLE "_people_v" ADD COLUMN "version_quote_es" varchar;
  ALTER TABLE "_people_v" ADD COLUMN "version_editorial_bio_es" jsonb;
  ALTER TABLE "_people_v" ADD COLUMN "version_verdict_es" varchar;
  ALTER TABLE "people_can_help_with" ADD CONSTRAINT "people_can_help_with_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people_can_help_with_es" ADD CONSTRAINT "people_can_help_with_es_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_people_v_version_can_help_with" ADD CONSTRAINT "_people_v_version_can_help_with_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_people_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_people_v_version_can_help_with_es" ADD CONSTRAINT "_people_v_version_can_help_with_es_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_people_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "people_can_help_with_order_idx" ON "people_can_help_with" USING btree ("_order");
  CREATE INDEX "people_can_help_with_parent_id_idx" ON "people_can_help_with" USING btree ("_parent_id");
  CREATE INDEX "people_can_help_with_es_order_idx" ON "people_can_help_with_es" USING btree ("_order");
  CREATE INDEX "people_can_help_with_es_parent_id_idx" ON "people_can_help_with_es" USING btree ("_parent_id");
  CREATE INDEX "_people_v_version_can_help_with_order_idx" ON "_people_v_version_can_help_with" USING btree ("_order");
  CREATE INDEX "_people_v_version_can_help_with_parent_id_idx" ON "_people_v_version_can_help_with" USING btree ("_parent_id");
  CREATE INDEX "_people_v_version_can_help_with_es_order_idx" ON "_people_v_version_can_help_with_es" USING btree ("_order");
  CREATE INDEX "_people_v_version_can_help_with_es_parent_id_idx" ON "_people_v_version_can_help_with_es" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "people_can_help_with" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "people_can_help_with_es" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_people_v_version_can_help_with" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_people_v_version_can_help_with_es" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "people_can_help_with" CASCADE;
  DROP TABLE "people_can_help_with_es" CASCADE;
  DROP TABLE "_people_v_version_can_help_with" CASCADE;
  DROP TABLE "_people_v_version_can_help_with_es" CASCADE;
  ALTER TABLE "people_links" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "people_links" ALTER COLUMN "type" SET DEFAULT 'personal_site'::text;
  UPDATE "people_links" SET "type" = 'other' WHERE "type" = 'discord';
  DROP TYPE "public"."enum_people_links_type";
  CREATE TYPE "public"."enum_people_links_type" AS ENUM('personal_site', 'newsletter', 'youtube', 'linkedin', 'x', 'instagram', 'github', 'email', 'other');
  ALTER TABLE "people_links" ALTER COLUMN "type" SET DEFAULT 'personal_site'::"public"."enum_people_links_type";
  ALTER TABLE "people_links" ALTER COLUMN "type" SET DATA TYPE "public"."enum_people_links_type" USING "type"::"public"."enum_people_links_type";
  ALTER TABLE "_people_v_version_links" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "_people_v_version_links" ALTER COLUMN "type" SET DEFAULT 'personal_site'::text;
  UPDATE "_people_v_version_links" SET "type" = 'other' WHERE "type" = 'discord';
  DROP TYPE "public"."enum__people_v_version_links_type";
  CREATE TYPE "public"."enum__people_v_version_links_type" AS ENUM('personal_site', 'newsletter', 'youtube', 'linkedin', 'x', 'instagram', 'github', 'email', 'other');
  ALTER TABLE "_people_v_version_links" ALTER COLUMN "type" SET DEFAULT 'personal_site'::"public"."enum__people_v_version_links_type";
  ALTER TABLE "_people_v_version_links" ALTER COLUMN "type" SET DATA TYPE "public"."enum__people_v_version_links_type" USING "type"::"public"."enum__people_v_version_links_type";
  ALTER TABLE "people" DROP COLUMN "name_zh";
  ALTER TABLE "people" DROP COLUMN "quote";
  ALTER TABLE "people" DROP COLUMN "editorial_bio";
  ALTER TABLE "people" DROP COLUMN "verdict";
  ALTER TABLE "people" DROP COLUMN "quote_es";
  ALTER TABLE "people" DROP COLUMN "editorial_bio_es";
  ALTER TABLE "people" DROP COLUMN "verdict_es";
  ALTER TABLE "_people_v" DROP COLUMN "version_name_zh";
  ALTER TABLE "_people_v" DROP COLUMN "version_quote";
  ALTER TABLE "_people_v" DROP COLUMN "version_editorial_bio";
  ALTER TABLE "_people_v" DROP COLUMN "version_verdict";
  ALTER TABLE "_people_v" DROP COLUMN "version_quote_es";
  ALTER TABLE "_people_v" DROP COLUMN "version_editorial_bio_es";
  ALTER TABLE "_people_v" DROP COLUMN "version_verdict_es";`)
}
