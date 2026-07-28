import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "people" ADD COLUMN "portrait_id" integer;
  ALTER TABLE "people" ADD COLUMN "author_approval_recorded_at" timestamp(3) with time zone;
  ALTER TABLE "people" ADD COLUMN "profile_published_at" timestamp(3) with time zone;
  ALTER TABLE "articles" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_published_at" timestamp(3) with time zone;
  ALTER TABLE "people" ADD CONSTRAINT "people_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "people_portrait_idx" ON "people" USING btree ("portrait_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "people" DROP CONSTRAINT "people_portrait_id_media_id_fk";

  DROP INDEX "people_portrait_idx";
  ALTER TABLE "people" DROP COLUMN "portrait_id";
  ALTER TABLE "people" DROP COLUMN "author_approval_recorded_at";
  ALTER TABLE "people" DROP COLUMN "profile_published_at";
  ALTER TABLE "articles" DROP COLUMN "published_at";
  ALTER TABLE "_articles_v" DROP COLUMN "version_published_at";`)
}
