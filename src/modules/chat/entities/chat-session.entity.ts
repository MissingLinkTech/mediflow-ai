import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity.js';
import { User } from '@/modules/users/entities/user.entity.js';
import { ChatStatus } from '../enums/chat-status.enum.js';
import { ChatType } from '../enums/chat-type.enum.js';

/**
 * A single conversation owned by one user.
 *
 * History is derived from {@link Message} rows ordered chronologically;
 * there is intentionally no separate history table. Structured workflow
 * state (future LangGraph state) lives in {@link ChatContext}, not here.
 */
@Index('idx_chat_sessions_user_updated', ['user', 'updatedAt'])
@Index('idx_chat_sessions_user_status', ['user', 'status'])
@Entity('chat_sessions')
export class ChatSession extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string | null;

  @Column({ type: 'enum', enum: ChatType, default: ChatType.GENERAL })
  type: ChatType;

  @Column({ type: 'enum', enum: ChatStatus, default: ChatStatus.ACTIVE })
  status: ChatStatus;
}
