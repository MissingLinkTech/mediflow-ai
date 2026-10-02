import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Full name for the new account.',
    example: 'Ava Patel',
    minLength: 2,
    maxLength: 100,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Unique login email address.',
    example: 'ava.patel@example.com',
    format: 'email',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Account password (8-128 chars).',
    example: 'Str0ng!Passw0rd2026',
    minLength: 8,
    maxLength: 128,
    format: 'password',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
