import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiProviderName } from '@/modules/ai/enums/ai-provider-name.enum.js';
import { ChatStatus } from '../../enums/chat-status.enum.js';
import { ChatType } from '../../enums/chat-type.enum.js';
import { MessageRole } from '../../enums/message-role.enum.js';
import { MessageStatus } from '../../enums/message-status.enum.js';

/**
 * Structured conversation state attached to a chat session.
 * Empty (`{}`) until future workflow phases populate it.
 */
export class ChatContextResponseDto {
  @ApiProperty({
    description: 'Unique context identifier (UUID v4).',
    example: '9f2c1a7e-3b4d-4f6a-8c1e-2d5b7a9c0e3f',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Workflow-state category. `general` until later phases.',
    example: 'general',
    maxLength: 50,
  })
  contextType: string;

  @ApiProperty({
    description: 'Schemaless structured state stored as JSONB.',
    example: {
      primaryComplaint: 'headache',
      duration: '3 days',
      informationComplete: false,
    },
  })
  contextData: Record<string, unknown>;

  @ApiProperty({
    description: 'Record creation timestamp (UTC).',
    example: '2026-10-03T10:24:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Record last-update timestamp (UTC).',
    example: '2026-10-03T10:24:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}

/**
 * Public shape of a chat session inside the success envelope.
 * Never contains another user's data — every read is scoped to the
 * caller before this shape is produced.
 */
export class ChatSessionResponseDto {
  @ApiProperty({
    description: 'Unique chat identifier (UUID v4).',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Conversation title. `null` when never provided.',
    example: 'Headache follow-up',
    nullable: true,
    maxLength: 200,
  })
  title: string | null;

  @ApiProperty({
    description: 'Conversation kind.',
    enum: ChatType,
    example: ChatType.GENERAL,
  })
  type: ChatType;

  @ApiProperty({
    description: 'Conversation lifecycle state.',
    enum: ChatStatus,
    example: ChatStatus.ACTIVE,
  })
  status: ChatStatus;

  @ApiProperty({
    description: 'Record creation timestamp (UTC).',
    example: '2026-10-03T10:24:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description:
      'Last-activity timestamp (UTC). Bumped whenever a message is added.',
    example: '2026-10-03T10:31:12.000Z',
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description:
      'Structured state for this chat. Present on single-chat reads; absent from list items.',
    type: ChatContextResponseDto,
    required: false,
  })
  context?: ChatContextResponseDto | null;
}

/** Public shape of a single chat message inside the success envelope. */
export class MessageResponseDto {
  @ApiProperty({
    description: 'Unique message identifier (UUID v4).',
    example: 'a1b2c3d4-5678-4abc-9def-0123456789ab',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Author of the message.',
    enum: MessageRole,
    example: MessageRole.USER,
  })
  role: MessageRole;

  @ApiProperty({
    description: 'Message body.',
    example: 'I have had headaches for three days.',
    maxLength: 20000,
  })
  content: string;

  @ApiProperty({
    description: 'Processing state of the message.',
    enum: MessageStatus,
    example: MessageStatus.COMPLETED,
  })
  status: MessageStatus;

  @ApiProperty({
    description: 'Record creation timestamp (UTC).',
    example: '2026-10-03T10:25:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Record last-update timestamp (UTC).',
    example: '2026-10-03T10:25:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}

/**
 * Pair returned by `POST /chats/:id/messages`: the persisted USER message
 * and the generated ASSISTANT reply. The generating provider is exposed,
 * while model and token metadata remain server-side.
 */
export class ChatReplyResponseDto {
  @ApiProperty({
    description: 'The persisted USER message.',
    type: MessageResponseDto,
  })
  userMessage: MessageResponseDto;

  @ApiProperty({
    description:
      'The persisted ASSISTANT reply (`completed`), or a `failed` placeholder when generation failed.',
    type: MessageResponseDto,
  })
  assistantMessage: MessageResponseDto;

  @ApiProperty({
    description: 'The provider that generated the assistant reply.',
    enum: AiProviderName,
    example: AiProviderName.GEMINI,
  })
  provider: AiProviderName;
}
