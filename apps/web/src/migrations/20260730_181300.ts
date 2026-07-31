import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_agent_oauth_clients_grant_types" AS ENUM('authorization_code', 'refresh_token');
  CREATE TYPE "public"."enum_agent_oauth_clients_token_endpoint_auth_method" AS ENUM('none');
  CREATE TYPE "public"."enum_agent_connections_scopes" AS ENUM('agent:member', 'offline_access');
  CREATE TYPE "public"."enum_agent_connections_state" AS ENUM('active', 'revoked', 'compromised');
  CREATE TYPE "public"."enum_agent_events_object_type" AS ENUM('account', 'article', 'connection');
  CREATE TYPE "public"."enum_agent_events_result" AS ENUM('pending', 'success', 'denied', 'conflict', 'failed');
  CREATE TABLE "agent_oauth_clients_redirect_uris" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "uri" varchar NOT NULL
  );

  CREATE TABLE "agent_oauth_clients_grant_types" (
  "order" integer NOT NULL,
  "parent_id" integer NOT NULL,
  "value" "enum_agent_oauth_clients_grant_types",
  "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "agent_oauth_clients" (
  "id" serial PRIMARY KEY NOT NULL,
  "client_id" varchar NOT NULL,
  "client_name" varchar NOT NULL,
  "client_family" varchar NOT NULL,
  "token_endpoint_auth_method" "enum_agent_oauth_clients_token_endpoint_auth_method" DEFAULT 'none' NOT NULL,
  "disabled" boolean DEFAULT false NOT NULL,
  "expires_at" timestamp(3) with time zone,
  "last_used_at" timestamp(3) with time zone,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "agent_connections_scopes" (
  "order" integer NOT NULL,
  "parent_id" integer NOT NULL,
  "value" "enum_agent_connections_scopes",
  "id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "agent_connections" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "person_id" integer,
  "client_id" integer NOT NULL,
  "resource" varchar NOT NULL,
  "token_family" varchar NOT NULL,
  "state" "enum_agent_connections_state" DEFAULT 'active' NOT NULL,
  "authorization_code_digest" varchar,
  "code_challenge" varchar,
  "authorization_redirect_uri" varchar,
  "code_expires_at" timestamp(3) with time zone,
  "code_consumed_at" timestamp(3) with time zone,
  "access_token_digest" varchar,
  "access_expires_at" timestamp(3) with time zone,
  "refresh_token_digest" varchar,
  "previous_refresh_token_digest" varchar,
  "refresh_expires_at" timestamp(3) with time zone,
  "last_used_at" timestamp(3) with time zone,
  "revoked_at" timestamp(3) with time zone,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "agent_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "connection_id" integer,
  "client_family" varchar NOT NULL,
  "tool" varchar NOT NULL,
  "object_type" "enum_agent_events_object_type",
  "object_id" varchar,
  "request_id" varchar NOT NULL,
	"idempotency_digest" varchar,
	"input_fingerprint" varchar,
  "result" "enum_agent_events_result" NOT NULL,
  "before_revision" varchar,
  "after_revision" varchar,
  "occurred_at" timestamp(3) with time zone NOT NULL,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "agent_oauth_clients_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "agent_connections_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "agent_events_id" integer;
  ALTER TABLE "agent_oauth_clients_redirect_uris" ADD CONSTRAINT "agent_oauth_clients_redirect_uris_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."agent_oauth_clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agent_oauth_clients_grant_types" ADD CONSTRAINT "agent_oauth_clients_grant_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."agent_oauth_clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agent_connections_scopes" ADD CONSTRAINT "agent_connections_scopes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."agent_connections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "agent_connections" ADD CONSTRAINT "agent_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agent_connections" ADD CONSTRAINT "agent_connections_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agent_connections" ADD CONSTRAINT "agent_connections_client_id_agent_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."agent_oauth_clients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "agent_events" ADD CONSTRAINT "agent_events_connection_id_agent_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."agent_connections"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "agent_oauth_clients_redirect_uris_order_idx" ON "agent_oauth_clients_redirect_uris" USING btree ("_order");
  CREATE INDEX "agent_oauth_clients_redirect_uris_parent_id_idx" ON "agent_oauth_clients_redirect_uris" USING btree ("_parent_id");
  CREATE INDEX "agent_oauth_clients_grant_types_order_idx" ON "agent_oauth_clients_grant_types" USING btree ("order");
  CREATE INDEX "agent_oauth_clients_grant_types_parent_idx" ON "agent_oauth_clients_grant_types" USING btree ("parent_id");
  CREATE UNIQUE INDEX "agent_oauth_clients_client_id_idx" ON "agent_oauth_clients" USING btree ("client_id");
  CREATE INDEX "agent_oauth_clients_client_family_idx" ON "agent_oauth_clients" USING btree ("client_family");
  CREATE INDEX "agent_oauth_clients_disabled_idx" ON "agent_oauth_clients" USING btree ("disabled");
  CREATE INDEX "agent_oauth_clients_expires_at_idx" ON "agent_oauth_clients" USING btree ("expires_at");
  CREATE INDEX "agent_oauth_clients_updated_at_idx" ON "agent_oauth_clients" USING btree ("updated_at");
  CREATE INDEX "agent_oauth_clients_created_at_idx" ON "agent_oauth_clients" USING btree ("created_at");
  CREATE INDEX "agent_connections_scopes_order_idx" ON "agent_connections_scopes" USING btree ("order");
  CREATE INDEX "agent_connections_scopes_parent_idx" ON "agent_connections_scopes" USING btree ("parent_id");
  CREATE INDEX "agent_connections_user_idx" ON "agent_connections" USING btree ("user_id");
  CREATE INDEX "agent_connections_person_idx" ON "agent_connections" USING btree ("person_id");
  CREATE INDEX "agent_connections_client_idx" ON "agent_connections" USING btree ("client_id");
  CREATE UNIQUE INDEX "agent_connections_token_family_idx" ON "agent_connections" USING btree ("token_family");
  CREATE INDEX "agent_connections_state_idx" ON "agent_connections" USING btree ("state");
  CREATE UNIQUE INDEX "agent_connections_authorization_code_digest_idx" ON "agent_connections" USING btree ("authorization_code_digest");
  CREATE UNIQUE INDEX "agent_connections_access_token_digest_idx" ON "agent_connections" USING btree ("access_token_digest");
  CREATE UNIQUE INDEX "agent_connections_refresh_token_digest_idx" ON "agent_connections" USING btree ("refresh_token_digest");
  CREATE INDEX "agent_connections_previous_refresh_token_digest_idx" ON "agent_connections" USING btree ("previous_refresh_token_digest");
  CREATE INDEX "agent_connections_updated_at_idx" ON "agent_connections" USING btree ("updated_at");
  CREATE INDEX "agent_connections_created_at_idx" ON "agent_connections" USING btree ("created_at");
  CREATE INDEX "agent_events_user_idx" ON "agent_events" USING btree ("user_id");
  CREATE INDEX "agent_events_connection_idx" ON "agent_events" USING btree ("connection_id");
  CREATE INDEX "agent_events_client_family_idx" ON "agent_events" USING btree ("client_family");
  CREATE INDEX "agent_events_tool_idx" ON "agent_events" USING btree ("tool");
  CREATE INDEX "agent_events_request_id_idx" ON "agent_events" USING btree ("request_id");
  CREATE UNIQUE INDEX "agent_events_idempotency_digest_idx" ON "agent_events" USING btree ("idempotency_digest");
  CREATE INDEX "agent_events_occurred_at_idx" ON "agent_events" USING btree ("occurred_at");
  CREATE INDEX "agent_events_updated_at_idx" ON "agent_events" USING btree ("updated_at");
  CREATE INDEX "agent_events_created_at_idx" ON "agent_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_oauth_clients_fk" FOREIGN KEY ("agent_oauth_clients_id") REFERENCES "public"."agent_oauth_clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_connections_fk" FOREIGN KEY ("agent_connections_id") REFERENCES "public"."agent_connections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_events_fk" FOREIGN KEY ("agent_events_id") REFERENCES "public"."agent_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_agent_oauth_clients_id_idx" ON "payload_locked_documents_rels" USING btree ("agent_oauth_clients_id");
  CREATE INDEX "payload_locked_documents_rels_agent_connections_id_idx" ON "payload_locked_documents_rels" USING btree ("agent_connections_id");
  CREATE INDEX "payload_locked_documents_rels_agent_events_id_idx" ON "payload_locked_documents_rels" USING btree ("agent_events_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agent_oauth_clients_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agent_connections_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agent_events_fk";
  DROP INDEX "payload_locked_documents_rels_agent_oauth_clients_id_idx";
  DROP INDEX "payload_locked_documents_rels_agent_connections_id_idx";
  DROP INDEX "payload_locked_documents_rels_agent_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agent_oauth_clients_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agent_connections_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agent_events_id";
  ALTER TABLE "agent_oauth_clients_redirect_uris" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agent_oauth_clients_grant_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agent_oauth_clients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agent_connections_scopes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agent_connections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agent_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "agent_oauth_clients_redirect_uris" CASCADE;
  DROP TABLE "agent_oauth_clients_grant_types" CASCADE;
  DROP TABLE "agent_oauth_clients" CASCADE;
  DROP TABLE "agent_connections_scopes" CASCADE;
  DROP TABLE "agent_connections" CASCADE;
  DROP TABLE "agent_events" CASCADE;
  DROP TYPE "public"."enum_agent_oauth_clients_grant_types";
  DROP TYPE "public"."enum_agent_oauth_clients_token_endpoint_auth_method";
  DROP TYPE "public"."enum_agent_connections_scopes";
  DROP TYPE "public"."enum_agent_connections_state";
  DROP TYPE "public"."enum_agent_events_object_type";
  DROP TYPE "public"."enum_agent_events_result";`)
}
