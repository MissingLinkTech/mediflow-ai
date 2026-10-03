import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity.js';
import type { AiProviderName } from '@/modules/ai/enums/ai-provider-name.enum.js';
import { Message } from './message.entity.js';

/**
 * Generation metadata for one assistant message. Only created when the
 * provider actually reports values — counts are passed through, never
 * invented. `provider` is a plain varchar (not a Postgres enum) so Phase 5
 * providers fit without a schema redesign.
 */
@Index('uq_message_metadata_message_id', ['message'], { unique: true })
@Entity('message_metadata')
export class MessageMetadata extends BaseEntity {
  @OneToOne(() => Message, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @Column({ type: 'varchar', length: 20 })
  provider: AiProviderName;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ name: 'input_tokens', type: 'int', nullable: true })
  inputTokens: number | null;

  @Column({ name: 'output_tokens', type: 'int', nullable: true })
  outputTokens: number | null;

  @Column({ name: 'total_tokens', type: 'int', nullable: true })
  totalTokens: number | null;

  @Column({ name: 'latency_ms', type: 'int', nullable: true })
  latencyMs: number | null;

  @Column({
    name: 'finish_reason',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  finishReason: string | null;
}
