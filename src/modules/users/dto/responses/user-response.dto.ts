import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@/common/enums/role.enum.js';

/**
 * Public account settings embedded in {@link UserResponseDto}.
 * Never contains secrets — only display preferences.
 */
export class UserSettingsResponseDto {
  @ApiPropertyOptional({
    description: 'Display name shown across the product UI.',
    example: 'Ava Patel',
    maxLength: 100,
  })
  displayName?: string;

  @ApiPropertyOptional({
    description: 'BCP-47 locale tag used for formatting dates and messages.',
    example: 'en-US',
    maxLength: 50,
  })
  locale?: string;

  @ApiPropertyOptional({
    description: 'IANA timezone identifier for the account.',
    example: 'America/New_York',
    maxLength: 100,
  })
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Whether the user opted in to notification emails.',
    example: true,
  })
  notificationEmails?: boolean;
}

/**
 * Safe public shape of a user returned inside the success envelope.
 * Password hashes, refresh-token hashes, and reset-token hashes are never
 * exposed — they are stripped by `ClassSerializerInterceptor` / `@Exclude`.
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'Unique user identifier (UUID v4).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Full name of the user. `null` when never provided.',
    example: 'Ava Patel',
    nullable: true,
    maxLength: 100,
  })
  name: string | null;

  @ApiProperty({
    description: 'Primary, lower-cased login email. Unique per user.',
    example: 'ava.patel@example.com',
    format: 'email',
    maxLength: 254,
  })
  email: string;

  @ApiProperty({
    description: 'Authorization role used by role-based guards.',
    enum: Role,
    example: Role.USER,
  })
  role: Role;

  @ApiProperty({
    description:
      'Whether the account can authenticate. Deactivated accounts receive 401 on login.',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Timestamp of email verification. `null` when unverified.',
    example: '2026-09-18T10:24:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  emailVerifiedAt: Date | null;

  @ApiProperty({
    description: 'Display preferences and notification opt-ins.',
    type: UserSettingsResponseDto,
  })
  settings: UserSettingsResponseDto;

  @ApiProperty({
    description: 'Record creation timestamp (UTC).',
    example: '2026-09-18T10:24:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Record last-update timestamp (UTC).',
    example: '2026-10-01T08:12:44.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
