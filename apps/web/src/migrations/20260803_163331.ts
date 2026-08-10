import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_editorial_masters_source_notes_rights" AS ENUM('official', 'permission', 'factual_reference', 'human_reference', 'restricted');
  CREATE TYPE "public"."enum_editorial_masters_risk" AS ENUM('evergreen', 'annual', 'volatile', 'high');
  CREATE TYPE "public"."enum_editorial_masters_rights_status" AS ENUM('pending', 'cleared', 'restricted');
  CREATE TYPE "public"."enum_editorial_masters_editorial_status" AS ENUM('candidate', 'in_review', 'approved', 'translated', 'released');
  CREATE TYPE "public"."enum_editorial_masters_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__editorial_masters_v_version_source_notes_rights" AS ENUM('official', 'permission', 'factual_reference', 'human_reference', 'restricted');
  CREATE TYPE "public"."enum__editorial_masters_v_version_risk" AS ENUM('evergreen', 'annual', 'volatile', 'high');
  CREATE TYPE "public"."enum__editorial_masters_v_version_rights_status" AS ENUM('pending', 'cleared', 'restricted');
  CREATE TYPE "public"."enum__editorial_masters_v_version_editorial_status" AS ENUM('candidate', 'in_review', 'approved', 'translated', 'released');
  CREATE TYPE "public"."enum__editorial_masters_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_articles_authorship_type" AS ENUM('member', 'site');
  CREATE TYPE "public"."enum__articles_v_version_authorship_type" AS ENUM('member', 'site');
  CREATE TABLE "editorial_masters_source_notes" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "label" varchar,
  "url" varchar,
  "captured_at" timestamp(3) with time zone,
  "checked_at" timestamp(3) with time zone,
  "rights" "enum_editorial_masters_source_notes_rights",
  "check" varchar
  );

  CREATE TABLE "editorial_masters" (
  "id" serial PRIMARY KEY NOT NULL,
  "title_zh" varchar,
  "summary_zh" varchar,
  "body_zh" jsonb,
  "content_key" varchar,
  "batch_id" varchar,
  "purpose_id" integer,
  "risk" "enum_editorial_masters_risk" DEFAULT 'evergreen',
  "rights_status" "enum_editorial_masters_rights_status" DEFAULT 'pending',
  "editorial_status" "enum_editorial_masters_editorial_status" DEFAULT 'candidate',
  "translation_notes" varchar,
  "assigned_editor_id" integer,
  "reviewed_at" timestamp(3) with time zone,
  "reviewed_by_id" integer,
  "created_by_id" integer,
  "content_hash" varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "_status" "enum_editorial_masters_status" DEFAULT 'draft'
  );

  CREATE TABLE "editorial_masters_rels" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" varchar NOT NULL,
  "taxonomies_id" integer
  );

  CREATE TABLE "_editorial_masters_v_version_source_notes" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "label" varchar,
  "url" varchar,
  "captured_at" timestamp(3) with time zone,
  "checked_at" timestamp(3) with time zone,
  "rights" "enum__editorial_masters_v_version_source_notes_rights",
  "check" varchar,
  "_uuid" varchar
  );

  CREATE TABLE "_editorial_masters_v" (
  "id" serial PRIMARY KEY NOT NULL,
  "parent_id" integer,
  "version_title_zh" varchar,
  "version_summary_zh" varchar,
  "version_body_zh" jsonb,
  "version_content_key" varchar,
  "version_batch_id" varchar,
  "version_purpose_id" integer,
  "version_risk" "enum__editorial_masters_v_version_risk" DEFAULT 'evergreen',
  "version_rights_status" "enum__editorial_masters_v_version_rights_status" DEFAULT 'pending',
  "version_editorial_status" "enum__editorial_masters_v_version_editorial_status" DEFAULT 'candidate',
  "version_translation_notes" varchar,
  "version_assigned_editor_id" integer,
  "version_reviewed_at" timestamp(3) with time zone,
  "version_reviewed_by_id" integer,
  "version_created_by_id" integer,
  "version_content_hash" varchar,
  "version_updated_at" timestamp(3) with time zone,
  "version_created_at" timestamp(3) with time zone,
  "version__status" "enum__editorial_masters_v_version_status" DEFAULT 'draft',
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "latest" boolean,
  "autosave" boolean
  );

  CREATE TABLE "_editorial_masters_v_rels" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer,
  "parent_id" integer NOT NULL,
  "path" varchar NOT NULL,
  "taxonomies_id" integer
  );

  ALTER TABLE "articles_source_notes" ADD COLUMN "checked_at" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "authorship_type" "enum_articles_authorship_type" DEFAULT 'member';
  ALTER TABLE "articles" ADD COLUMN "editorial_master_id" integer;
  ALTER TABLE "articles" ADD COLUMN "seo_title" varchar;
  ALTER TABLE "articles" ADD COLUMN "seo_description" varchar;
  ALTER TABLE "articles" ADD COLUMN "seo_image_id" integer;
  ALTER TABLE "articles_rels" ADD COLUMN "people_id" integer;
  ALTER TABLE "_articles_v_version_source_notes" ADD COLUMN "checked_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_authorship_type" "enum__articles_v_version_authorship_type" DEFAULT 'member';
  ALTER TABLE "_articles_v" ADD COLUMN "version_editorial_master_id" integer;
  ALTER TABLE "_articles_v" ADD COLUMN "version_seo_title" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_seo_description" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_seo_image_id" integer;
  ALTER TABLE "_articles_v_rels" ADD COLUMN "people_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "editorial_masters_id" integer;
  ALTER TABLE "editorial_masters_source_notes" ADD CONSTRAINT "editorial_masters_source_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."editorial_masters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "editorial_masters" ADD CONSTRAINT "editorial_masters_purpose_id_taxonomies_id_fk" FOREIGN KEY ("purpose_id") REFERENCES "public"."taxonomies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "editorial_masters" ADD CONSTRAINT "editorial_masters_assigned_editor_id_users_id_fk" FOREIGN KEY ("assigned_editor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "editorial_masters" ADD CONSTRAINT "editorial_masters_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "editorial_masters" ADD CONSTRAINT "editorial_masters_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "editorial_masters_rels" ADD CONSTRAINT "editorial_masters_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."editorial_masters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "editorial_masters_rels" ADD CONSTRAINT "editorial_masters_rels_taxonomies_fk" FOREIGN KEY ("taxonomies_id") REFERENCES "public"."taxonomies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_editorial_masters_v_version_source_notes" ADD CONSTRAINT "_editorial_masters_v_version_source_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_editorial_masters_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_editorial_masters_v" ADD CONSTRAINT "_editorial_masters_v_parent_id_editorial_masters_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."editorial_masters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_editorial_masters_v" ADD CONSTRAINT "_editorial_masters_v_version_purpose_id_taxonomies_id_fk" FOREIGN KEY ("version_purpose_id") REFERENCES "public"."taxonomies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_editorial_masters_v" ADD CONSTRAINT "_editorial_masters_v_version_assigned_editor_id_users_id_fk" FOREIGN KEY ("version_assigned_editor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_editorial_masters_v" ADD CONSTRAINT "_editorial_masters_v_version_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_editorial_masters_v" ADD CONSTRAINT "_editorial_masters_v_version_created_by_id_users_id_fk" FOREIGN KEY ("version_created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_editorial_masters_v_rels" ADD CONSTRAINT "_editorial_masters_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_editorial_masters_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_editorial_masters_v_rels" ADD CONSTRAINT "_editorial_masters_v_rels_taxonomies_fk" FOREIGN KEY ("taxonomies_id") REFERENCES "public"."taxonomies"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "editorial_masters_source_notes_order_idx" ON "editorial_masters_source_notes" USING btree ("_order");
  CREATE INDEX "editorial_masters_source_notes_parent_id_idx" ON "editorial_masters_source_notes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "editorial_masters_content_key_idx" ON "editorial_masters" USING btree ("content_key");
  CREATE INDEX "editorial_masters_batch_id_idx" ON "editorial_masters" USING btree ("batch_id");
  CREATE INDEX "editorial_masters_purpose_idx" ON "editorial_masters" USING btree ("purpose_id");
  CREATE INDEX "editorial_masters_assigned_editor_idx" ON "editorial_masters" USING btree ("assigned_editor_id");
  CREATE INDEX "editorial_masters_reviewed_by_idx" ON "editorial_masters" USING btree ("reviewed_by_id");
  CREATE INDEX "editorial_masters_created_by_idx" ON "editorial_masters" USING btree ("created_by_id");
  CREATE INDEX "editorial_masters_content_hash_idx" ON "editorial_masters" USING btree ("content_hash");
  CREATE INDEX "editorial_masters_updated_at_idx" ON "editorial_masters" USING btree ("updated_at");
  CREATE INDEX "editorial_masters_created_at_idx" ON "editorial_masters" USING btree ("created_at");
  CREATE INDEX "editorial_masters__status_idx" ON "editorial_masters" USING btree ("_status");
  CREATE INDEX "editorial_masters_rels_order_idx" ON "editorial_masters_rels" USING btree ("order");
  CREATE INDEX "editorial_masters_rels_parent_idx" ON "editorial_masters_rels" USING btree ("parent_id");
  CREATE INDEX "editorial_masters_rels_path_idx" ON "editorial_masters_rels" USING btree ("path");
  CREATE INDEX "editorial_masters_rels_taxonomies_id_idx" ON "editorial_masters_rels" USING btree ("taxonomies_id");
  CREATE INDEX "_editorial_masters_v_version_source_notes_order_idx" ON "_editorial_masters_v_version_source_notes" USING btree ("_order");
  CREATE INDEX "_editorial_masters_v_version_source_notes_parent_id_idx" ON "_editorial_masters_v_version_source_notes" USING btree ("_parent_id");
  CREATE INDEX "_editorial_masters_v_parent_idx" ON "_editorial_masters_v" USING btree ("parent_id");
  CREATE INDEX "_editorial_masters_v_version_version_content_key_idx" ON "_editorial_masters_v" USING btree ("version_content_key");
  CREATE INDEX "_editorial_masters_v_version_version_batch_id_idx" ON "_editorial_masters_v" USING btree ("version_batch_id");
  CREATE INDEX "_editorial_masters_v_version_version_purpose_idx" ON "_editorial_masters_v" USING btree ("version_purpose_id");
  CREATE INDEX "_editorial_masters_v_version_version_assigned_editor_idx" ON "_editorial_masters_v" USING btree ("version_assigned_editor_id");
  CREATE INDEX "_editorial_masters_v_version_version_reviewed_by_idx" ON "_editorial_masters_v" USING btree ("version_reviewed_by_id");
  CREATE INDEX "_editorial_masters_v_version_version_created_by_idx" ON "_editorial_masters_v" USING btree ("version_created_by_id");
  CREATE INDEX "_editorial_masters_v_version_version_content_hash_idx" ON "_editorial_masters_v" USING btree ("version_content_hash");
  CREATE INDEX "_editorial_masters_v_version_version_updated_at_idx" ON "_editorial_masters_v" USING btree ("version_updated_at");
  CREATE INDEX "_editorial_masters_v_version_version_created_at_idx" ON "_editorial_masters_v" USING btree ("version_created_at");
  CREATE INDEX "_editorial_masters_v_version_version__status_idx" ON "_editorial_masters_v" USING btree ("version__status");
  CREATE INDEX "_editorial_masters_v_created_at_idx" ON "_editorial_masters_v" USING btree ("created_at");
  CREATE INDEX "_editorial_masters_v_updated_at_idx" ON "_editorial_masters_v" USING btree ("updated_at");
  CREATE INDEX "_editorial_masters_v_latest_idx" ON "_editorial_masters_v" USING btree ("latest");
  CREATE INDEX "_editorial_masters_v_autosave_idx" ON "_editorial_masters_v" USING btree ("autosave");
  CREATE INDEX "_editorial_masters_v_rels_order_idx" ON "_editorial_masters_v_rels" USING btree ("order");
  CREATE INDEX "_editorial_masters_v_rels_parent_idx" ON "_editorial_masters_v_rels" USING btree ("parent_id");
  CREATE INDEX "_editorial_masters_v_rels_path_idx" ON "_editorial_masters_v_rels" USING btree ("path");
  CREATE INDEX "_editorial_masters_v_rels_taxonomies_id_idx" ON "_editorial_masters_v_rels" USING btree ("taxonomies_id");
  ALTER TABLE "articles" ADD CONSTRAINT "articles_editorial_master_id_editorial_masters_id_fk" FOREIGN KEY ("editorial_master_id") REFERENCES "public"."editorial_masters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_rels" ADD CONSTRAINT "articles_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_editorial_master_id_editorial_masters_id_fk" FOREIGN KEY ("version_editorial_master_id") REFERENCES "public"."editorial_masters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_rels" ADD CONSTRAINT "_articles_v_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_editorial_masters_fk" FOREIGN KEY ("editorial_masters_id") REFERENCES "public"."editorial_masters"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_authorship_type_idx" ON "articles" USING btree ("authorship_type");
  CREATE INDEX "articles_editorial_master_idx" ON "articles" USING btree ("editorial_master_id");
  CREATE INDEX "articles_seo_seo_image_idx" ON "articles" USING btree ("seo_image_id");
  CREATE INDEX "articles_rels_people_id_idx" ON "articles_rels" USING btree ("people_id");
  CREATE INDEX "_articles_v_version_version_authorship_type_idx" ON "_articles_v" USING btree ("version_authorship_type");
  CREATE INDEX "_articles_v_version_version_editorial_master_idx" ON "_articles_v" USING btree ("version_editorial_master_id");
  CREATE INDEX "_articles_v_version_seo_version_seo_image_idx" ON "_articles_v" USING btree ("version_seo_image_id");
  CREATE INDEX "_articles_v_rels_people_id_idx" ON "_articles_v_rels" USING btree ("people_id");
  CREATE INDEX "payload_locked_documents_rels_editorial_masters_id_idx" ON "payload_locked_documents_rels" USING btree ("editorial_masters_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "editorial_masters_source_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "editorial_masters" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "editorial_masters_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_editorial_masters_v_version_source_notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_editorial_masters_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_editorial_masters_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "editorial_masters_source_notes" CASCADE;
  DROP TABLE "editorial_masters" CASCADE;
  DROP TABLE "editorial_masters_rels" CASCADE;
  DROP TABLE "_editorial_masters_v_version_source_notes" CASCADE;
  DROP TABLE "_editorial_masters_v" CASCADE;
  DROP TABLE "_editorial_masters_v_rels" CASCADE;
  ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_editorial_master_id_editorial_masters_id_fk";

  ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_seo_image_id_media_id_fk";

  ALTER TABLE "articles_rels" DROP CONSTRAINT IF EXISTS "articles_rels_people_fk";

  ALTER TABLE "_articles_v" DROP CONSTRAINT IF EXISTS "_articles_v_version_editorial_master_id_editorial_masters_id_fk";

  ALTER TABLE "_articles_v" DROP CONSTRAINT IF EXISTS "_articles_v_version_seo_image_id_media_id_fk";

  ALTER TABLE "_articles_v_rels" DROP CONSTRAINT IF EXISTS "_articles_v_rels_people_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_editorial_masters_fk";

  DROP INDEX "articles_authorship_type_idx";
  DROP INDEX "articles_editorial_master_idx";
  DROP INDEX "articles_seo_seo_image_idx";
  DROP INDEX "articles_rels_people_id_idx";
  DROP INDEX "_articles_v_version_version_authorship_type_idx";
  DROP INDEX "_articles_v_version_version_editorial_master_idx";
  DROP INDEX "_articles_v_version_seo_version_seo_image_idx";
  DROP INDEX "_articles_v_rels_people_id_idx";
  DROP INDEX "payload_locked_documents_rels_editorial_masters_id_idx";
  ALTER TABLE "articles_source_notes" DROP COLUMN "checked_at";
  ALTER TABLE "articles" DROP COLUMN "authorship_type";
  ALTER TABLE "articles" DROP COLUMN "editorial_master_id";
  ALTER TABLE "articles" DROP COLUMN "seo_title";
  ALTER TABLE "articles" DROP COLUMN "seo_description";
  ALTER TABLE "articles" DROP COLUMN "seo_image_id";
  ALTER TABLE "articles_rels" DROP COLUMN "people_id";
  ALTER TABLE "_articles_v_version_source_notes" DROP COLUMN "checked_at";
  ALTER TABLE "_articles_v" DROP COLUMN "version_authorship_type";
  ALTER TABLE "_articles_v" DROP COLUMN "version_editorial_master_id";
  ALTER TABLE "_articles_v" DROP COLUMN "version_seo_title";
  ALTER TABLE "_articles_v" DROP COLUMN "version_seo_description";
  ALTER TABLE "_articles_v" DROP COLUMN "version_seo_image_id";
  ALTER TABLE "_articles_v_rels" DROP COLUMN "people_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "editorial_masters_id";
  DROP TYPE "public"."enum_editorial_masters_source_notes_rights";
  DROP TYPE "public"."enum_editorial_masters_risk";
  DROP TYPE "public"."enum_editorial_masters_rights_status";
  DROP TYPE "public"."enum_editorial_masters_editorial_status";
  DROP TYPE "public"."enum_editorial_masters_status";
  DROP TYPE "public"."enum__editorial_masters_v_version_source_notes_rights";
  DROP TYPE "public"."enum__editorial_masters_v_version_risk";
  DROP TYPE "public"."enum__editorial_masters_v_version_rights_status";
  DROP TYPE "public"."enum__editorial_masters_v_version_editorial_status";
  DROP TYPE "public"."enum__editorial_masters_v_version_status";
  DROP TYPE "public"."enum_articles_authorship_type";
  DROP TYPE "public"."enum__articles_v_version_authorship_type";`)
}
