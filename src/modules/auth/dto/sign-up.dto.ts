import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from './password-rules.js';

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class SignUpDto {
  @ApiPropertyOptional({
    description: 'Optional full name. Blank strings are stored as `null`.',
    example: 'Ava Patel',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(trimString)
  name?: string;

  @ApiProperty({
    description:
      'Unique login email. Trimmed and lower-cased; duplicates return `409 Conflict`.',
    example: 'ava.patel@example.com',
    format: 'email',
    maxLength: 254,
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254)
  @Transform(normalizeEmail)
  email: string;

  @ApiProperty({
    description: `Account password. Must be 12-128 chars and satisfy: ${PASSWORD_RULE_MESSAGE}. Stored as bcrypt hash.`,
    example: 'Str0ng!Passw0rd2026',
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
