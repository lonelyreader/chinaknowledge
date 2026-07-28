import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_publication_status" AS ENUM('draft', 'published', 'withdrawn');
  CREATE TYPE "public"."enum_articles_curation_status" AS ENUM('not_selected', 'selected', 'editing', 'curated', 'needs_recheck', 'removed');
  CREATE TYPE "public"."enum__articles_v_version_publication_status" AS ENUM('draft', 'published', 'withdrawn');
  CREATE TYPE "public"."enum__articles_v_version_curation_status" AS ENUM('not_selected', 'selected', 'editing', 'curated', 'needs_recheck', 'removed');
  CREATE TYPE "public"."enum_workflow_events_axis" AS ENUM('publication', 'curation');
  ALTER TYPE "public"."enum_workflow_events_from_status" ADD VALUE 'published' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_from_status" ADD VALUE 'withdrawn' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_from_status" ADD VALUE 'not_selected' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_from_status" ADD VALUE 'selected' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_from_status" ADD VALUE 'editing' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_from_status" ADD VALUE 'curated' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_from_status" ADD VALUE 'needs_recheck' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_from_status" ADD VALUE 'removed' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_to_status" ADD VALUE 'published' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_to_status" ADD VALUE 'withdrawn' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_to_status" ADD VALUE 'not_selected' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_to_status" ADD VALUE 'selected' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_to_status" ADD VALUE 'editing' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_to_status" ADD VALUE 'curated' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_to_status" ADD VALUE 'needs_recheck' BEFORE 'submitted';
  ALTER TYPE "public"."enum_workflow_events_to_status" ADD VALUE 'removed' BEFORE 'submitted';
  ALTER TABLE "media" ADD COLUMN "member_use_published_at" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "publication_status" "enum_articles_publication_status" DEFAULT 'draft';
  ALTER TABLE "articles" ADD COLUMN "curation_status" "enum_articles_curation_status" DEFAULT 'not_selected';
  ALTER TABLE "_articles_v" ADD COLUMN "version_publication_status" "enum__articles_v_version_publication_status" DEFAULT 'draft';
  ALTER TABLE "_articles_v" ADD COLUMN "version_curation_status" "enum__articles_v_version_curation_status" DEFAULT 'not_selected';
  ALTER TABLE "_articles_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "workflow_events" ADD COLUMN "axis" "enum_workflow_events_axis";
  ALTER TABLE "people" ALTER COLUMN "identity" DROP NOT NULL;
  ALTER TABLE "people" ALTER COLUMN "introduction" DROP NOT NULL;
  ALTER TABLE "people" ALTER COLUMN "city" DROP NOT NULL;

  UPDATE "articles"
  SET
    "publication_status" = CASE
      WHEN "workflow_status" = 'public' THEN 'published'::"enum_articles_publication_status"
      WHEN "workflow_status" = 'archived' THEN 'withdrawn'::"enum_articles_publication_status"
      ELSE 'draft'::"enum_articles_publication_status"
    END,
    "curation_status" = CASE
      WHEN "workflow_status" = 'public' THEN 'curated'::"enum_articles_curation_status"
      WHEN "workflow_status" = 'archived' THEN 'removed'::"enum_articles_curation_status"
      ELSE 'not_selected'::"enum_articles_curation_status"
    END;

  UPDATE "_articles_v"
  SET
    "version_publication_status" = CASE
      WHEN "version_workflow_status" = 'public' THEN 'published'::"enum__articles_v_version_publication_status"
      WHEN "version_workflow_status" = 'archived' THEN 'withdrawn'::"enum__articles_v_version_publication_status"
      ELSE 'draft'::"enum__articles_v_version_publication_status"
    END,
    "version_curation_status" = CASE
      WHEN "version_workflow_status" = 'public' THEN 'curated'::"enum__articles_v_version_curation_status"
      WHEN "version_workflow_status" = 'archived' THEN 'removed'::"enum__articles_v_version_curation_status"
      ELSE 'not_selected'::"enum__articles_v_version_curation_status"
    END;

  UPDATE "media"
  SET "member_use_published_at" = "public_use_approved_at"
  WHERE "public_use_approved_at" IS NOT NULL;

  ALTER TABLE "articles" ALTER COLUMN "publication_status" SET NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "curation_status" SET NOT NULL;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_publication_status" SET NOT NULL;
  ALTER TABLE "_articles_v" ALTER COLUMN "version_curation_status" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DO $$
  BEGIN
    IF EXISTS (
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
    ) THEN
      RAISE EXCEPTION 'Cannot safely roll back member publishing and editorial curation after new-model writes. Restore the pre-migration backup instead.';
    END IF;
  END $$;

  UPDATE "people" SET "identity" = '' WHERE "identity" IS NULL;
  UPDATE "people" SET "introduction" = '' WHERE "introduction" IS NULL;
  UPDATE "people" SET "city" = '' WHERE "city" IS NULL;
  ALTER TABLE "people" ALTER COLUMN "identity" SET NOT NULL;
  ALTER TABLE "people" ALTER COLUMN "introduction" SET NOT NULL;
  ALTER TABLE "people" ALTER COLUMN "city" SET NOT NULL;

  UPDATE "articles"
  SET
    "workflow_status" = CASE
      WHEN "publication_status" = 'published' THEN 'public'::"enum_articles_workflow_status"
      WHEN "publication_status" = 'withdrawn' THEN 'archived'::"enum_articles_workflow_status"
      ELSE 'draft'::"enum_articles_workflow_status"
    END,
    "_status" = CASE
      WHEN "publication_status" = 'published' THEN 'published'::"enum_articles_status"
      ELSE 'draft'::"enum_articles_status"
    END;

  UPDATE "_articles_v"
  SET
    "version_workflow_status" = CASE
      WHEN "version_publication_status" = 'published' THEN 'public'::"enum__articles_v_version_workflow_status"
      WHEN "version_publication_status" = 'withdrawn' THEN 'archived'::"enum__articles_v_version_workflow_status"
      ELSE 'draft'::"enum__articles_v_version_workflow_status"
    END,
    "version__status" = CASE
      WHEN "version_publication_status" = 'published' THEN 'published'::"enum__articles_v_version_status"
      ELSE 'draft'::"enum__articles_v_version_status"
    END;

  ALTER TABLE "workflow_events" ALTER COLUMN "from_status" SET DATA TYPE text;
  ALTER TABLE "workflow_events" ALTER COLUMN "to_status" SET DATA TYPE text;

  UPDATE "workflow_events" SET "from_status" = CASE "from_status"::text
    WHEN 'published' THEN 'public'
    WHEN 'withdrawn' THEN 'archived'
    WHEN 'not_selected' THEN 'draft'
    WHEN 'selected' THEN 'in_review'
    WHEN 'editing' THEN 'in_review'
    WHEN 'curated' THEN 'public'
    WHEN 'needs_recheck' THEN 'in_review'
    WHEN 'removed' THEN 'archived'
    ELSE "from_status"::text
  END;
  UPDATE "workflow_events" SET "to_status" = CASE "to_status"::text
    WHEN 'published' THEN 'public'
    WHEN 'withdrawn' THEN 'archived'
    WHEN 'not_selected' THEN 'draft'
    WHEN 'selected' THEN 'in_review'
    WHEN 'editing' THEN 'in_review'
    WHEN 'curated' THEN 'public'
    WHEN 'needs_recheck' THEN 'in_review'
    WHEN 'removed' THEN 'archived'
    ELSE "to_status"::text
  END;

  DROP TYPE "public"."enum_workflow_events_from_status";
  CREATE TYPE "public"."enum_workflow_events_from_status" AS ENUM('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'public', 'archived');
  ALTER TABLE "workflow_events" ALTER COLUMN "from_status" SET DATA TYPE "public"."enum_workflow_events_from_status" USING "from_status"::"public"."enum_workflow_events_from_status";
  DROP TYPE "public"."enum_workflow_events_to_status";
  CREATE TYPE "public"."enum_workflow_events_to_status" AS ENUM('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'public', 'archived');
  ALTER TABLE "workflow_events" ALTER COLUMN "to_status" SET DATA TYPE "public"."enum_workflow_events_to_status" USING "to_status"::"public"."enum_workflow_events_to_status";
  ALTER TABLE "media" DROP COLUMN "member_use_published_at";
  ALTER TABLE "articles" DROP COLUMN "publication_status";
  ALTER TABLE "articles" DROP COLUMN "curation_status";
  ALTER TABLE "_articles_v" DROP COLUMN "version_publication_status";
  ALTER TABLE "_articles_v" DROP COLUMN "version_curation_status";
  ALTER TABLE "_articles_v" DROP COLUMN "autosave";
  ALTER TABLE "workflow_events" DROP COLUMN "axis";
  DROP TYPE "public"."enum_articles_publication_status";
  DROP TYPE "public"."enum_articles_curation_status";
  DROP TYPE "public"."enum__articles_v_version_publication_status";
  DROP TYPE "public"."enum__articles_v_version_curation_status";
  DROP TYPE "public"."enum_workflow_events_axis";`)
}
