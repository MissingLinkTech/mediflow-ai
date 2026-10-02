import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

function normalizeEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class LoginDto {
  @ApiProperty({
    description:
      'Account email address. Trimmed and lower-cased before lookup.',
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
    description:
      'Account password in plain text over TLS. Compared against the stored bcrypt hash; never persisted or logged.',
    example: 'Str0ng!Passw0rd2026',
    minLength: 1,
    maxLength: 128,
    format: 'password',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  password: string;
}
