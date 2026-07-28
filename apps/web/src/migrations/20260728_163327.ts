import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum__people_v_version_languages" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum__people_v_version_profile_status" AS ENUM('draft', 'public', 'paused');
  CREATE TABLE "_people_v_version_languages" (
    "order" integer NOT NULL,
    "parent_id" integer NOT NULL,
    "value" "enum__people_v_version_languages",
    "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "_people_v_version_links" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "label" varchar NOT NULL,
    "url" varchar NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_people_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "parent_id" integer,
    "version_name" varchar NOT NULL,
    "version_slug" varchar NOT NULL,
    "version_identity" varchar,
    "version_introduction" varchar,
    "version_city" varchar,
    "version_portrait_id" integer,
    "version_user_id" integer,
    "version_profile_status" "enum__people_v_version_profile_status" DEFAULT 'draft' NOT NULL,
    "version_author_approval_recorded_at" timestamp(3) with time zone,
    "version_profile_published_at" timestamp(3) with time zone,
    "version_spotlight_excluded" boolean DEFAULT false,
    "version_spotlight_pinned_until" timestamp(3) with time zone,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "_people_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "taxonomies_id" integer
  );

  ALTER TABLE "people" ALTER COLUMN "user_id" DROP NOT NULL;
  ALTER TABLE "_people_v_version_languages" ADD CONSTRAINT "_people_v_version_languages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_people_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_people_v_version_links" ADD CONSTRAINT "_people_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_people_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_people_v" ADD CONSTRAINT "_people_v_parent_id_people_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_people_v" ADD CONSTRAINT "_people_v_version_portrait_id_media_id_fk" FOREIGN KEY ("version_portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_people_v" ADD CONSTRAINT "_people_v_version_user_id_users_id_fk" FOREIGN KEY ("version_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_people_v_rels" ADD CONSTRAINT "_people_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_people_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_people_v_rels" ADD CONSTRAINT "_people_v_rels_taxonomies_fk" FOREIGN KEY ("taxonomies_id") REFERENCES "public"."taxonomies"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_people_v_version_languages_order_idx" ON "_people_v_version_languages" USING btree ("order");
  CREATE INDEX "_people_v_version_languages_parent_idx" ON "_people_v_version_languages" USING btree ("parent_id");
  CREATE INDEX "_people_v_version_links_order_idx" ON "_people_v_version_links" USING btree ("_order");
  CREATE INDEX "_people_v_version_links_parent_id_idx" ON "_people_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "_people_v_parent_idx" ON "_people_v" USING btree ("parent_id");
  CREATE INDEX "_people_v_version_version_slug_idx" ON "_people_v" USING btree ("version_slug");
  CREATE INDEX "_people_v_version_version_portrait_idx" ON "_people_v" USING btree ("version_portrait_id");
  CREATE INDEX "_people_v_version_version_user_idx" ON "_people_v" USING btree ("version_user_id");
  CREATE INDEX "_people_v_version_version_updated_at_idx" ON "_people_v" USING btree ("version_updated_at");
  CREATE INDEX "_people_v_version_version_created_at_idx" ON "_people_v" USING btree ("version_created_at");
  CREATE INDEX "_people_v_created_at_idx" ON "_people_v" USING btree ("created_at");
  CREATE INDEX "_people_v_updated_at_idx" ON "_people_v" USING btree ("updated_at");
  CREATE INDEX "_people_v_rels_order_idx" ON "_people_v_rels" USING btree ("order");
  CREATE INDEX "_people_v_rels_parent_idx" ON "_people_v_rels" USING btree ("parent_id");
  CREATE INDEX "_people_v_rels_path_idx" ON "_people_v_rels" USING btree ("path");
  CREATE INDEX "_people_v_rels_taxonomies_id_idx" ON "_people_v_rels" USING btree ("taxonomies_id");`)
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
      SELECT 1 FROM "workflow_events" WHERE "axis" IS NOT NULL
    ) OR EXISTS (
      SELECT 1 FROM "users" WHERE "account_status" = 'paused'
    ) THEN
      RAISE EXCEPTION 'Cannot safely roll back member publishing, profile history, or account state after new-model writes. Restore the pre-migration backup instead.';
    END IF;
  END $$;

  ALTER TABLE "_people_v_version_languages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_people_v_version_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_people_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_people_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_people_v_version_languages" CASCADE;
  DROP TABLE "_people_v_version_links" CASCADE;
  DROP TABLE "_people_v" CASCADE;
  DROP TABLE "_people_v_rels" CASCADE;
  ALTER TABLE "people" ALTER COLUMN "user_id" SET NOT NULL;
  DROP TYPE "public"."enum__people_v_version_languages";
  DROP TYPE "public"."enum__people_v_version_profile_status";`)
}
