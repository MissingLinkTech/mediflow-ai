import { ApiProperty } from '@nestjs/swagger';
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
import { AiProviderName } from '@/modules/ai/enums/ai-provider-name.enum.js';

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateMessageDto {
  @ApiProperty({
    description:
      'User message body. Blank strings are rejected. Role and processing state are backend-controlled: the message is always stored as USER/COMPLETED and answered by the AI assistant.',
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

  @ApiProperty({
    description:
      'Optional AI provider override. API keys, model names, and provider settings remain server-controlled.',
    enum: AiProviderName,
    example: AiProviderName.GROQ,
    required: false,
  })
  @IsOptional()
  @IsEnum(AiProviderName)
  provider?: AiProviderName;
}
