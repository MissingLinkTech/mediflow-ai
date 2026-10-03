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
import { ChatStatus } from '../enums/chat-status.enum.js';

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateChatDto {
  @ApiPropertyOptional({
    description: 'Replacement conversation title.',
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
    description:
      'Conversation lifecycle state. Set `archived` to archive a chat.',
    enum: ChatStatus,
    example: ChatStatus.ARCHIVED,
    required: false,
  })
  @IsOptional()
  @IsEnum(ChatStatus)
  status?: ChatStatus;
}
