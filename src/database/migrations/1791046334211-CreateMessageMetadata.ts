import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 4: AI generation metadata.
 *
 * Creates `message_metadata` with a 1:1 unique constraint against
 * `messages` and a cascading ownership foreign key. Existing tables and
 * their data are untouched.
 */
export class CreateMessageMetadata1791046334211 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "message_metadata" (` +
        `"id" UUID NOT NULL DEFAULT uuid_generate_v4(), ` +
        `"created_at" TIMESTAMPTZ NOT NULL DEFAULT now(), ` +
        `"updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(), ` +
        `"message_id" UUID NOT NULL, ` +
        `"provider" VARCHAR(20) NOT NULL, ` +
        `"model" VARCHAR(100) NOT NULL, ` +
        `"input_tokens" INT, ` +
        `"output_tokens" INT, ` +
        `"total_tokens" INT, ` +
        `"latency_ms" INT, ` +
        `"finish_reason" VARCHAR(50), ` +
        `CONSTRAINT "PK_message_metadata_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_metadata" ADD CONSTRAINT "FK_message_metadata_message_id" ` +
        `FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_message_metadata_message_id" ON "message_metadata" ("message_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "message_metadata"`);
  }
}
