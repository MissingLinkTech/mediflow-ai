import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

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
}
