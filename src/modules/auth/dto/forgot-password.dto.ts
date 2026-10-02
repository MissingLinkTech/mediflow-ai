import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

function normalizeEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(254)
  @Transform(normalizeEmail)
  email: string;
}
