import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

function normalizeEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description:
      'Account email to send the reset link to. Always returns `204` even when unknown, to prevent account enumeration.',
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
}
