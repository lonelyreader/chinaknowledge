import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_person_revisions_proposed_languages" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum_person_revisions_status" AS ENUM('draft', 'submitted', 'changes_requested', 'applied');
  CREATE TABLE "person_revisions_proposed_languages" (
	"order" integer NOT NULL,
	"parent_id" integer NOT NULL,
	"value" "enum_person_revisions_proposed_languages",
	"id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "person_revisions_proposed_links" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"label" varchar NOT NULL,
	"url" varchar NOT NULL
  );

  CREATE TABLE "person_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" integer NOT NULL,
	"proposer_id" integer NOT NULL,
	"proposed_identity" varchar NOT NULL,
	"proposed_introduction" varchar NOT NULL,
	"proposed_city" varchar NOT NULL,
	"proposed_portrait_id" integer,
	"status" "enum_person_revisions_status" DEFAULT 'draft' NOT NULL,
	"editor_note" varchar,
	"submitted_at" timestamp(3) with time zone,
	"reviewed_at" timestamp(3) with time zone,
	"reviewer_id" integer,
	"applied_at" timestamp(3) with time zone,
	"open_person_key" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "person_revisions_rels" (
	"id" serial PRIMARY KEY NOT NULL,
	"order" integer,
	"parent_id" integer NOT NULL,
	"path" varchar NOT NULL,
	"taxonomies_id" integer
  );

  ALTER TABLE "media" ADD COLUMN "public_use_approved_at" timestamp(3) with time zone;
  ALTER TABLE "media" ADD COLUMN "public_use_approved_by_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "person_revisions_id" integer;
  ALTER TABLE "person_revisions_proposed_languages" ADD CONSTRAINT "person_revisions_proposed_languages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."person_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "person_revisions_proposed_links" ADD CONSTRAINT "person_revisions_proposed_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."person_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "person_revisions" ADD CONSTRAINT "person_revisions_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "person_revisions" ADD CONSTRAINT "person_revisions_proposer_id_users_id_fk" FOREIGN KEY ("proposer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "person_revisions" ADD CONSTRAINT "person_revisions_proposed_portrait_id_media_id_fk" FOREIGN KEY ("proposed_portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "person_revisions" ADD CONSTRAINT "person_revisions_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "person_revisions_rels" ADD CONSTRAINT "person_revisions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."person_revisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "person_revisions_rels" ADD CONSTRAINT "person_revisions_rels_taxonomies_fk" FOREIGN KEY ("taxonomies_id") REFERENCES "public"."taxonomies"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "person_revisions_proposed_languages_order_idx" ON "person_revisions_proposed_languages" USING btree ("order");
  CREATE INDEX "person_revisions_proposed_languages_parent_idx" ON "person_revisions_proposed_languages" USING btree ("parent_id");
  CREATE INDEX "person_revisions_proposed_links_order_idx" ON "person_revisions_proposed_links" USING btree ("_order");
  CREATE INDEX "person_revisions_proposed_links_parent_id_idx" ON "person_revisions_proposed_links" USING btree ("_parent_id");
  CREATE INDEX "person_revisions_person_idx" ON "person_revisions" USING btree ("person_id");
  CREATE UNIQUE INDEX "person_revisions_open_person_key_idx" ON "person_revisions" USING btree ("open_person_key");
  CREATE INDEX "person_revisions_proposer_idx" ON "person_revisions" USING btree ("proposer_id");
  CREATE INDEX "person_revisions_proposed_portrait_idx" ON "person_revisions" USING btree ("proposed_portrait_id");
  CREATE INDEX "person_revisions_reviewer_idx" ON "person_revisions" USING btree ("reviewer_id");
  CREATE INDEX "person_revisions_updated_at_idx" ON "person_revisions" USING btree ("updated_at");
  CREATE INDEX "person_revisions_created_at_idx" ON "person_revisions" USING btree ("created_at");
  CREATE INDEX "person_revisions_rels_order_idx" ON "person_revisions_rels" USING btree ("order");
  CREATE INDEX "person_revisions_rels_parent_idx" ON "person_revisions_rels" USING btree ("parent_id");
  CREATE INDEX "person_revisions_rels_path_idx" ON "person_revisions_rels" USING btree ("path");
  CREATE INDEX "person_revisions_rels_taxonomies_id_idx" ON "person_revisions_rels" USING btree ("taxonomies_id");
  ALTER TABLE "media" ADD CONSTRAINT "media_public_use_approved_by_id_users_id_fk" FOREIGN KEY ("public_use_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_person_revisions_fk" FOREIGN KEY ("person_revisions_id") REFERENCES "public"."person_revisions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_public_use_approved_by_idx" ON "media" USING btree ("public_use_approved_by_id");
  CREATE INDEX "payload_locked_documents_rels_person_revisions_id_idx" ON "payload_locked_documents_rels" USING btree ("person_revisions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_person_revisions_fk";
  ALTER TABLE "media" DROP CONSTRAINT "media_public_use_approved_by_id_users_id_fk";
  DROP INDEX "payload_locked_documents_rels_person_revisions_id_idx";
  DROP INDEX "media_public_use_approved_by_idx";
  DROP INDEX "person_revisions_open_person_key_idx";
  ALTER TABLE "person_revisions_proposed_languages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "person_revisions_proposed_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "person_revisions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "person_revisions_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "person_revisions_proposed_languages" CASCADE;
  DROP TABLE "person_revisions_proposed_links" CASCADE;
  DROP TABLE "person_revisions" CASCADE;
  DROP TABLE "person_revisions_rels" CASCADE;
  ALTER TABLE "media" DROP COLUMN "public_use_approved_at";
  ALTER TABLE "media" DROP COLUMN "public_use_approved_by_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "person_revisions_id";
  DROP TYPE "public"."enum_person_revisions_proposed_languages";
  DROP TYPE "public"."enum_person_revisions_status";`)
}
