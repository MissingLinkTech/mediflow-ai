import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ChatType } from '../enums/chat-type.enum.js';

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateChatDto {
  @ApiPropertyOptional({
    description:
      'Optional conversation title. Omitted titles are stored as `null`.',
    example: 'Headache follow-up',
    minLength: 1,
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trimString)
  title?: string;

  @ApiPropertyOptional({
    description: 'Conversation kind. Defaults to `general` when omitted.',
    enum: ChatType,
    example: ChatType.GENERAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(ChatType)
  type?: ChatType;
}
