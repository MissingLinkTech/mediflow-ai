import { Column, Entity } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Role } from '../../../common/enums/role.enum.js';

export interface UserSettings {
  displayName?: string;
  locale?: string;
  timezone?: string;
  notificationEmails?: boolean;
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 100, nullable: true })
  name: string | null;

  @Column({ unique: true })
  email: string;

  @Exclude({ toPlainOnly: true })
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Exclude({ toPlainOnly: true })
  @Column({ name: 'refresh_token_hash', type: 'text', nullable: true })
  refreshTokenHash: string | null;

  @Exclude({ toPlainOnly: true })
  @Column({ name: 'reset_password_token_hash', type: 'text', nullable: true })
  resetPasswordTokenHash: string | null;

  @Exclude({ toPlainOnly: true })
  @Column({
    name: 'reset_password_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  resetPasswordExpiresAt: Date | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  settings: UserSettings;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;
}
