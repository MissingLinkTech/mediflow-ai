import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MessageRole } from '../enums/message-role.enum.js';
import { MessageStatus } from '../enums/message-status.enum.js';

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateMessageDto {
  @ApiPropertyOptional({
    description:
      'Author of the message. Defaults to `user` when omitted. `tool` is reserved for future LangChain/LangGraph tool execution.',
    enum: MessageRole,
    example: MessageRole.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageRole)
  role?: MessageRole;

  @ApiProperty({
    description: 'Message body. Blank strings are rejected.',
    example: 'I have had headaches for three days.',
    minLength: 1,
    maxLength: 20000,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  @Transform(trimString)
  content: string;

  @ApiPropertyOptional({
    description:
      'Processing state of the message. Defaults to `completed` when omitted.',
    enum: MessageStatus,
    example: MessageStatus.COMPLETED,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;
}
