import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity.js';
import { MessageRole } from '../enums/message-role.enum.js';
import { MessageStatus } from '../enums/message-status.enum.js';
import { ChatSession } from './chat-session.entity.js';

/**
 * One turn of a conversation. Message rows ARE the chat history: a
 * conversation is read back as its messages ordered by
 * `createdAt ASC, id ASC`. The `TOOL` role is reserved for future
 * LangChain/LangGraph tool execution; no tool runs in this phase.
 */
@Index('idx_messages_session_chrono', ['chatSession', 'createdAt', 'id'])
@Entity('messages')
export class Message extends BaseEntity {
  @ManyToOne(() => ChatSession, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'chat_session_id' })
  chatSession: ChatSession;

  @Column({ type: 'enum', enum: MessageRole, default: MessageRole.USER })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.COMPLETED,
  })
  status: MessageStatus;
}
