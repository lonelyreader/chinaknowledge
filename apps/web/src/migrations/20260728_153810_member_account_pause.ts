import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_account_status" AS ENUM('active', 'paused');
  ALTER TABLE "users" ADD COLUMN "account_status" "enum_users_account_status" DEFAULT 'active' NOT NULL;
  CREATE INDEX "_articles_v_autosave_idx" ON "_articles_v" USING btree ("autosave");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM "users" WHERE "account_status" = 'paused') THEN
      RAISE EXCEPTION 'Cannot safely remove account status while paused accounts exist. Restore the pre-migration backup instead.';
    END IF;
  END $$;

  DROP INDEX "_articles_v_autosave_idx";
  ALTER TABLE "users" DROP COLUMN "account_status";
  DROP TYPE "public"."enum_users_account_status";`)
}
