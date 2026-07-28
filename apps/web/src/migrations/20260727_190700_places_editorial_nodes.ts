import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_places_locale" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum_places_status" AS ENUM('draft', 'public', 'paused');
  CREATE TYPE "public"."enum__places_v_version_locale" AS ENUM('en', 'es');
  CREATE TYPE "public"."enum__places_v_version_status" AS ENUM('draft', 'public', 'paused');
  CREATE TABLE "places" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"summary" varchar NOT NULL,
	"cover_image_id" integer,
	"locale" "enum_places_locale" NOT NULL,
	"slug" varchar NOT NULL,
	"translation_group" varchar NOT NULL,
	"geography_id" integer,
	"status" "enum_places_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp(3) with time zone,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "_places_v" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"version_name" varchar NOT NULL,
	"version_summary" varchar NOT NULL,
	"version_cover_image_id" integer,
	"version_locale" "enum__places_v_version_locale" NOT NULL,
	"version_slug" varchar NOT NULL,
	"version_translation_group" varchar NOT NULL,
	"version_geography_id" integer,
	"version_status" "enum__places_v_version_status" DEFAULT 'draft' NOT NULL,
	"version_published_at" timestamp(3) with time zone,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "places_id" integer;
  ALTER TABLE "places" ADD CONSTRAINT "places_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "places" ADD CONSTRAINT "places_geography_id_taxonomies_id_fk" FOREIGN KEY ("geography_id") REFERENCES "public"."taxonomies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_places_v" ADD CONSTRAINT "_places_v_parent_id_places_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_places_v" ADD CONSTRAINT "_places_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_places_v" ADD CONSTRAINT "_places_v_version_geography_id_taxonomies_id_fk" FOREIGN KEY ("version_geography_id") REFERENCES "public"."taxonomies"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "places_cover_image_idx" ON "places" USING btree ("cover_image_id");
  CREATE INDEX "places_locale_idx" ON "places" USING btree ("locale");
  CREATE INDEX "places_slug_idx" ON "places" USING btree ("slug");
  CREATE INDEX "places_translation_group_idx" ON "places" USING btree ("translation_group");
  CREATE INDEX "places_geography_idx" ON "places" USING btree ("geography_id");
  CREATE INDEX "places_updated_at_idx" ON "places" USING btree ("updated_at");
  CREATE INDEX "places_created_at_idx" ON "places" USING btree ("created_at");
  CREATE INDEX "_places_v_parent_idx" ON "_places_v" USING btree ("parent_id");
  CREATE INDEX "_places_v_version_version_cover_image_idx" ON "_places_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_places_v_version_version_locale_idx" ON "_places_v" USING btree ("version_locale");
  CREATE INDEX "_places_v_version_version_slug_idx" ON "_places_v" USING btree ("version_slug");
  CREATE INDEX "_places_v_version_version_translation_group_idx" ON "_places_v" USING btree ("version_translation_group");
  CREATE INDEX "_places_v_version_version_geography_idx" ON "_places_v" USING btree ("version_geography_id");
  CREATE INDEX "_places_v_version_version_updated_at_idx" ON "_places_v" USING btree ("version_updated_at");
  CREATE INDEX "_places_v_version_version_created_at_idx" ON "_places_v" USING btree ("version_created_at");
  CREATE INDEX "_places_v_created_at_idx" ON "_places_v" USING btree ("created_at");
  CREATE INDEX "_places_v_updated_at_idx" ON "_places_v" USING btree ("updated_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_places_fk" FOREIGN KEY ("places_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_places_id_idx" ON "payload_locked_documents_rels" USING btree ("places_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_places_fk";
  DROP INDEX "payload_locked_documents_rels_places_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "places_id";
  ALTER TABLE "places" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_places_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "places" CASCADE;
  DROP TABLE "_places_v" CASCADE;
  DROP TYPE "public"."enum_places_locale";
  DROP TYPE "public"."enum_places_status";
  DROP TYPE "public"."enum__places_v_version_locale";
  DROP TYPE "public"."enum__places_v_version_status";`)
}
