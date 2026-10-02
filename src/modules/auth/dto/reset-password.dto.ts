import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from './password-rules.js';

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'Opaque single-use reset token delivered out-of-band (email link). SHA-256 hashed server-side and expires 30 minutes after issue.',
    example: 'w7f8V2xQ9mZkP3nRtYvXcBqAsDfGhJkL0pO_uIyT6rE5wQ4eR',
    minLength: 20,
    maxLength: 128,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: `New account password. Must be 12-128 chars and satisfy: ${PASSWORD_RULE_MESSAGE}. Rotates refresh tokens on success.`,
    example: 'N3w!Str0ngPass2026',
    minLength: 12,
    maxLength: 128,
    format: 'password',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_RULE_MESSAGE })
  password: string;
}
