import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity.js';
import { ChatSession } from './chat-session.entity.js';

/** Free-form structured state attached to one chat session. */
export type ChatContextData = Record<string, unknown>;

/**
 * Structured conversation state kept separate from raw message history.
 * Raw turns live in {@link Message}; derived/workflow state (later managed
 * by LangGraph) lives here as schemaless JSONB. Never populated by AI in
 * this phase — rows are created empty alongside their chat session.
 */
@Index('uq_chat_contexts_chat_session_id', ['chatSession'], { unique: true })
@Entity('chat_contexts')
export class ChatContext extends BaseEntity {
  @OneToOne(() => ChatSession, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'chat_session_id' })
  chatSession: ChatSession;

  @Column({
    name: 'context_type',
    type: 'varchar',
    length: 50,
    default: 'general',
  })
  contextType: string;

  @Column({
    name: 'context_data',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  contextData: ChatContextData;
}
