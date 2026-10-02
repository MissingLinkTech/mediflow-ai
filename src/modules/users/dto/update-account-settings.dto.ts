import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateAccountSettingsDto {
  @ApiPropertyOptional({
    description:
      'Full name. Also mirrored into `settings.displayName` for UI display.',
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

  @ApiPropertyOptional({
    description: 'BCP-47 locale tag, e.g. `en-US`, used for formatting.',
    example: 'en-US',
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  locale?: string;

  @ApiPropertyOptional({
    description: 'IANA timezone identifier, e.g. `America/New_York`.',
    example: 'America/New_York',
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Opt in (`true`) or out (`false`) of notification emails.',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  notificationEmails?: boolean;
}
