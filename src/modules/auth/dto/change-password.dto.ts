import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from './password-rules.js';

export class ChangePasswordDto {
  @ApiProperty({
    description:
      'Current account password. Verified against the stored bcrypt hash before any change.',
    example: 'Str0ng!Passw0rd2026',
    minLength: 1,
    maxLength: 128,
    format: 'password',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  currentPassword: string;

  @ApiProperty({
    description: `Replacement password. Must be 12-128 chars and satisfy: ${PASSWORD_RULE_MESSAGE}. Clears refresh and reset tokens on success.`,
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
  newPassword: string;
}
