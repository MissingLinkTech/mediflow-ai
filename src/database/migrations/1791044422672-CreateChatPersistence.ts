import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 3: chat persistence.
 *
 * Creates `chat_sessions`, `messages`, and `chat_contexts` with ownership
 * foreign keys, PostgreSQL enum types, supporting indexes, and the unique
 * constraint backing the ChatSession 1:1 ChatContext relationship.
 *
 * Existing tables (notably `users`) and their data are untouched.
 */
export class CreateChatPersistence1791044422672 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "chat_sessions_type_enum" AS ENUM ('general', 'health_consultation', 'document_analysis')`,
    );
    await queryRunner.query(
      `CREATE TYPE "chat_sessions_status_enum" AS ENUM ('active', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TYPE "messages_role_enum" AS ENUM ('user', 'assistant', 'system', 'tool')`,
    );
    await queryRunner.query(
      `CREATE TYPE "messages_status_enum" AS ENUM ('pending', 'completed', 'failed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "chat_sessions" (` +
        `"id" UUID NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), ` +
        `"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), ` +
        `"user_id" UUID NOT NULL, ` +
        `"title" VARCHAR(200), ` +
        `"type" "chat_sessions_type_enum" NOT NULL DEFAULT 'general', ` +
        `"status" "chat_sessions_status_enum" NOT NULL DEFAULT 'active', ` +
        `CONSTRAINT "PK_chat_sessions_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_sessions" ADD CONSTRAINT "FK_chat_sessions_user_id" ` +
        `FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chat_sessions_user_updated" ON "chat_sessions" ("user_id", "updated_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_chat_sessions_user_status" ON "chat_sessions" ("user_id", "status")`,
    );

    await queryRunner.query(
      `CREATE TABLE "messages" (` +
        `"id" UUID NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), ` +
        `"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), ` +
        `"chat_session_id" UUID NOT NULL, ` +
        `"role" "messages_role_enum" NOT NULL DEFAULT 'user', ` +
        `"content" TEXT NOT NULL, ` +
        `"status" "messages_status_enum" NOT NULL DEFAULT 'completed', ` +
        `CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_chat_session_id" ` +
        `FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_messages_session_chrono" ON "messages" ("chat_session_id", "created_at" ASC, "id" ASC)`,
    );

    await queryRunner.query(
      `CREATE TABLE "chat_contexts" (` +
        `"id" UUID NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), ` +
        `"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), ` +
        `"chat_session_id" UUID NOT NULL, ` +
        `"context_type" VARCHAR(50) NOT NULL DEFAULT 'general', ` +
        `"context_data" JSONB NOT NULL DEFAULT '{}', ` +
        `CONSTRAINT "PK_chat_contexts_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_contexts" ADD CONSTRAINT "FK_chat_contexts_chat_session_id" ` +
        `FOREIGN KEY ("chat_session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_chat_contexts_chat_session_id" ON "chat_contexts" ("chat_session_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_contexts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_sessions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "messages_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "messages_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "chat_sessions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "chat_sessions_type_enum"`);
  }
}
