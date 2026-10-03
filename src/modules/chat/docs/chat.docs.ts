import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ResponseMessage } from '@/common/decorators/response-message.decorator.js';
import {
  ApiPaginatedResponse,
  ApiStandardErrorResponses,
  ApiStandardNoContent,
  ApiStandardResponse,
} from '@/common/decorators/swagger/index.js';
import { CreateChatDto } from '../dto/create-chat.dto.js';
import { CreateMessageDto } from '../dto/create-message.dto.js';
import { UpdateChatDto } from '../dto/update-chat.dto.js';
import {
  ChatReplyResponseDto,
  ChatSessionResponseDto,
  MessageResponseDto,
} from '../dto/responses/chat-response.dto.js';

const CHAT_ID_PARAM = {
  name: 'id',
  type: String,
  format: 'uuid',
  example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  description: 'Chat session identifier (UUID v4).',
} as const;

const CHAT_EXAMPLE = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  title: 'Headache follow-up',
  type: 'general',
  status: 'active',
  createdAt: '2026-10-03T10:24:00.000Z',
  updatedAt: '2026-10-03T10:31:12.000Z',
  context: {
    id: '9f2c1a7e-3b4d-4f6a-8c1e-2d5b7a9c0e3f',
    contextType: 'general',
    contextData: {},
    createdAt: '2026-10-03T10:24:00.000Z',
    updatedAt: '2026-10-03T10:24:00.000Z',
  },
};

const CHAT_LIST_ITEM_EXAMPLE = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  title: 'Headache follow-up',
  type: 'general',
  status: 'active',
  createdAt: '2026-10-03T10:24:00.000Z',
  updatedAt: '2026-10-03T10:31:12.000Z',
};

const MESSAGE_EXAMPLE = {
  id: 'a1b2c3d4-5678-4abc-9def-0123456789ab',
  role: 'user',
  content: 'I have had headaches for three days.',
  status: 'completed',
  createdAt: '2026-10-03T10:25:00.000Z',
  updatedAt: '2026-10-03T10:25:00.000Z',
};

function paginationQueries(): Array<MethodDecorator & ClassDecorator> {
  return [
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      description: 'Page number, starting at 1.',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 20,
      description: 'Items per page (1-100).',
    }),
  ];
}

/** Single-decorator documentation for chat persistence routes. */
export const ApiChatDocs = {
  createChat(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Chat created successfully'),
      ApiOperation({
        summary: 'Create a chat for the authenticated user',
        description: [
          'Creates a chat session owned by the caller plus its empty 1:1 structured context.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required. `Content-Type: application/json` required.',
          '',
          'Business rules:',
          '- The owner always comes from the access JWT (`sub` claim); no `userId` is accepted.',
          '- `title` is optional; `type` defaults to `general`.',
          '- A fresh `ChatContext` (`contextType: general`, `contextData: {}`) is created atomically with the chat.',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiBody({ type: CreateChatDto }),
      ApiStandardResponse({
        type: ChatSessionResponseDto,
        status: 201,
        description:
          'Created chat with its context, wrapped in the success envelope.',
        message: 'Chat created successfully',
        exampleData: CHAT_EXAMPLE,
      }),
      ApiStandardErrorResponses([400, 401, 500]),
    );
  },

  listChats(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Chats retrieved successfully'),
      ApiOperation({
        summary: 'List the authenticated user chats (latest activity first)',
        description: [
          'Returns one page of the caller’s own chats ordered by `updatedAt` descending inside `data.items`, with paging state in `data.meta`.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required.',
          'Query: `page` (default 1) and `limit` (default 20, max 100).',
          '',
          'Business rules:',
          '- Only chats owned by the caller are ever returned.',
          '- List items do not embed message history or context.',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ...paginationQueries(),
      ApiPaginatedResponse({
        type: ChatSessionResponseDto,
        status: 200,
        description: 'Paginated chats wrapped in the success envelope.',
        message: 'Chats retrieved successfully',
        exampleItems: [CHAT_LIST_ITEM_EXAMPLE],
      }),
      ApiStandardErrorResponses([400, 401, 500]),
    );
  },

  getChat(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Chat retrieved successfully'),
      ApiOperation({
        summary: 'Get one chat owned by the authenticated user',
        description: [
          'Returns a single chat with its 1:1 structured context. Message history is read via `GET /chats/:id/messages`.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required.',
          '',
          'Business rules:',
          '- The lookup is scoped to the caller (`chat.id` AND `chat.user.id`); foreign ids return 404 without revealing existence.',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiParam(CHAT_ID_PARAM),
      ApiStandardResponse({
        type: ChatSessionResponseDto,
        status: 200,
        description: 'Chat with context wrapped in the success envelope.',
        message: 'Chat retrieved successfully',
        exampleData: CHAT_EXAMPLE,
      }),
      ApiStandardErrorResponses([400, 401, 404, 500]),
    );
  },

  updateChat(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Chat updated successfully'),
      ApiOperation({
        summary: 'Update title or status of an owned chat',
        description: [
          'Partially updates the caller’s chat. Only provided fields change.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required. `Content-Type: application/json` required.',
          '',
          'Business rules:',
          '- Updatable fields: `title`, `status` (`active` | `archived`).',
          '- Foreign ids return 404 without revealing existence.',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiParam(CHAT_ID_PARAM),
      ApiBody({ type: UpdateChatDto }),
      ApiStandardResponse({
        type: ChatSessionResponseDto,
        status: 200,
        description:
          'Updated chat with context wrapped in the success envelope.',
        message: 'Chat updated successfully',
        exampleData: CHAT_EXAMPLE,
      }),
      ApiStandardErrorResponses([400, 401, 404, 500]),
    );
  },

  deleteChat(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete a chat owned by the authenticated user',
        description: [
          'Permanently removes the chat. Its messages and 1:1 context are removed by `ON DELETE CASCADE`.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required.',
          '',
          'Business rules:',
          '- This project has no soft-delete convention; deletion is a hard delete.',
          '- Foreign ids return 404 without revealing existence.',
          '- Responds `204 No Content` with an empty body.',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiParam(CHAT_ID_PARAM),
      ApiStandardNoContent({
        description: 'Chat deleted. Empty body.',
        errorStatuses: [400, 401, 404, 500],
      }),
    );
  },

  addMessage(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Message added successfully'),
      ApiOperation({
        summary: 'Send a message and receive the AI reply',
        description: [
          'Persists the caller’s USER message, generates an assistant reply with recent conversation history, and returns both persisted messages.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required. `Content-Type: application/json` required.',
          '',
          'Business rules:',
          '- The parent chat must belong to the caller; foreign ids return 404 without revealing existence.',
          '- The request carries `content` and may select only a supported `provider`; role, status, model, API credentials, base URLs, and system guidance are backend-controlled.',
          '- The assistant message is stored `completed` on success or `failed` with a generic fallback when generation fails.',
          '- The response identifies the provider used; model and token metadata remain server-side.',
          '- Provider failures return a controlled 503 (or 504 timeout) without fallback or sensitive details; the USER message and history stay intact for a retry.',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiParam(CHAT_ID_PARAM),
      ApiBody({ type: CreateMessageDto }),
      ApiStandardResponse({
        type: ChatReplyResponseDto,
        status: 201,
        description:
          'Persisted user message and assistant reply wrapped in the success envelope.',
        message: 'Message added successfully',
        exampleData: {
          userMessage: MESSAGE_EXAMPLE,
          assistantMessage: {
            ...MESSAGE_EXAMPLE,
            id: 'b2c3d4e5-6789-4bcd-9efa-1234567890bc',
            role: 'assistant',
            content: 'Can you tell me where the pain is located?',
          },
          provider: 'gemini',
        },
      }),
      ApiStandardErrorResponses([400, 401, 404, 500, 503, 504]),
    );
  },

  listMessages(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Messages retrieved successfully'),
      ApiOperation({
        summary: 'List message history of an owned chat (chronological)',
        description: [
          'Returns one page of the conversation history ordered by `createdAt` ascending with `id` as a deterministic tiebreak, inside `data.items` with paging state in `data.meta`.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required.',
          'Query: `page` (default 1) and `limit` (default 20, max 100).',
          '',
          'Business rules:',
          '- The parent chat must belong to the caller; foreign ids return 404 without revealing existence.',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiParam(CHAT_ID_PARAM),
      ...paginationQueries(),
      ApiPaginatedResponse({
        type: MessageResponseDto,
        status: 200,
        description: 'Paginated messages wrapped in the success envelope.',
        message: 'Messages retrieved successfully',
        exampleItems: [MESSAGE_EXAMPLE],
      }),
      ApiStandardErrorResponses([400, 401, 404, 500]),
    );
  },
};
