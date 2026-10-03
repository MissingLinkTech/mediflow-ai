import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto.js';
import {
  PageMetaDto,
  PaginatedResponseDto,
} from '@/common/dto/paginated-response.dto.js';
import {
  DEFAULT_AI_MAX_HISTORY_MESSAGES,
  MEDIFLOW_SYSTEM_INSTRUCTION,
} from '@/modules/ai/ai.constants.js';
import { AiService } from '@/modules/ai/ai.service.js';
import type { AiChatMessage } from '@/modules/ai/interfaces/ai-provider.interface.js';
import { User } from '@/modules/users/entities/user.entity.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { UpdateChatDto } from './dto/update-chat.dto.js';
import { ChatContext } from './entities/chat-context.entity.js';
import { ChatSession } from './entities/chat-session.entity.js';
import { MessageMetadata } from './entities/message-metadata.entity.js';
import { Message } from './entities/message.entity.js';
import { ChatStatus } from './enums/chat-status.enum.js';
import { ChatType } from './enums/chat-type.enum.js';
import { MessageRole } from './enums/message-role.enum.js';
import { MessageStatus } from './enums/message-status.enum.js';

/** A chat session together with its 1:1 structured context. */
export interface ChatDetail extends ChatSession {
  context: ChatContext | null;
}

/** Persisted USER message plus the generated ASSISTANT reply. */
export interface ChatReply {
  userMessage: Message;
  assistantMessage: Message;
}

const AI_REPLY_FALLBACK =
  'I was unable to generate a response right now. Please try again in a moment.';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ChatContext)
    private readonly chatContextRepository: Repository<ChatContext>,
    @InjectRepository(MessageMetadata)
    private readonly messageMetadataRepository: Repository<MessageMetadata>,
    private readonly dataSource: DataSource,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {}

  async createChat(userId: string, dto: CreateChatDto): Promise<ChatDetail> {
    return this.dataSource.transaction(async (manager) => {
      const sessionRepository = manager.getRepository(ChatSession);
      const contextRepository = manager.getRepository(ChatContext);

      const chat = await sessionRepository.save(
        sessionRepository.create({
          user: { id: userId } as User,
          title: dto.title ?? null,
          type: dto.type ?? ChatType.GENERAL,
          status: ChatStatus.ACTIVE,
        }),
      );
      const context = await contextRepository.save(
        contextRepository.create({
          chatSession: { id: chat.id } as ChatSession,
          contextType: 'general',
          contextData: {},
        }),
      );

      return { ...chat, context };
    });
  }

  async listChats(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ChatSession>> {
    const [items, totalItems] = await this.chatSessionRepository.findAndCount({
      where: { user: { id: userId } },
      order: { updatedAt: 'DESC', id: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      items,
      meta: PageMetaDto.create({
        page: query.page,
        limit: query.limit,
        totalItems,
      }),
    };
  }

  async getChat(userId: string, chatId: string): Promise<ChatDetail> {
    const chat = await this.findOwnedSessionOrFail(userId, chatId);
    const context = await this.chatContextRepository.findOne({
      where: { chatSession: { id: chat.id } },
    });

    return { ...chat, context };
  }

  async updateChat(
    userId: string,
    chatId: string,
    dto: UpdateChatDto,
  ): Promise<ChatDetail> {
    const chat = await this.findOwnedSessionOrFail(userId, chatId);

    if (dto.title !== undefined) {
      chat.title = dto.title;
    }

    if (dto.status !== undefined) {
      chat.status = dto.status;
    }

    const saved = await this.chatSessionRepository.save(chat);
    const context = await this.chatContextRepository.findOne({
      where: { chatSession: { id: saved.id } },
    });

    return { ...saved, context };
  }

  async deleteChat(userId: string, chatId: string): Promise<void> {
    const chat = await this.findOwnedSessionOrFail(userId, chatId);
    // Messages, the 1:1 context, and metadata are removed by ON DELETE CASCADE.
    await this.chatSessionRepository.delete(chat.id);
  }

  async addMessage(
    userId: string,
    chatId: string,
    dto: CreateMessageDto,
  ): Promise<ChatReply> {
    const chat = await this.findOwnedSessionOrFail(userId, chatId);

    // Role is backend-controlled: user-facing messages are always USER.
    const userMessage = await this.messageRepository.save(
      this.messageRepository.create({
        chatSession: { id: chat.id } as ChatSession,
        role: MessageRole.USER,
        content: dto.content,
        status: MessageStatus.COMPLETED,
      }),
    );

    // Adding a message is activity: keep latest-activity ordering accurate.
    chat.updatedAt = new Date();
    await this.chatSessionRepository.save(chat);

    const assistantMessage = await this.messageRepository.save(
      this.messageRepository.create({
        chatSession: { id: chat.id } as ChatSession,
        role: MessageRole.ASSISTANT,
        content: '',
        status: MessageStatus.PENDING,
      }),
    );

    // The external call runs outside any transaction: short writes only.
    try {
      const result = await this.aiService.generateReply({
        messages: toAiMessages(await this.loadRecentHistory(chat.id)),
        systemInstruction: MEDIFLOW_SYSTEM_INSTRUCTION,
      });

      assistantMessage.content = result.text;
      assistantMessage.status = MessageStatus.COMPLETED;
      const savedAssistant =
        await this.messageRepository.save(assistantMessage);

      await this.messageMetadataRepository.save(
        this.messageMetadataRepository.create({
          message: { id: savedAssistant.id } as Message,
          provider: result.provider,
          model: result.model,
          inputTokens: result.usage.inputTokens ?? null,
          outputTokens: result.usage.outputTokens ?? null,
          totalTokens: result.usage.totalTokens ?? null,
          latencyMs: result.latencyMs,
          finishReason: result.finishReason ?? null,
        }),
      );

      return { userMessage, assistantMessage: savedAssistant };
    } catch (error) {
      // No PENDING row is left behind; history stays intact for a retry.
      assistantMessage.content = AI_REPLY_FALLBACK;
      assistantMessage.status = MessageStatus.FAILED;
      await this.messageRepository.save(assistantMessage);
      throw error;
    }
  }

  async listMessages(
    userId: string,
    chatId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Message>> {
    await this.findOwnedSessionOrFail(userId, chatId);

    const [items, totalItems] = await this.messageRepository.findAndCount({
      where: { chatSession: { id: chatId } },
      order: { createdAt: 'ASC', id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      items,
      meta: PageMetaDto.create({
        page: query.page,
        limit: query.limit,
        totalItems,
      }),
    };
  }

  /**
   * Last N messages in deterministic chronological order. Bounded so the
   * provider never receives unlimited history; no summarization or memory.
   */
  private async loadRecentHistory(chatId: string): Promise<Message[]> {
    const limit = Math.max(
      1,
      Math.floor(
        this.configService.get<number>('AI_MAX_HISTORY_MESSAGES') ??
          DEFAULT_AI_MAX_HISTORY_MESSAGES,
      ),
    );
    const newestFirst = await this.messageRepository.find({
      where: {
        chatSession: { id: chatId },
        status: In([MessageStatus.COMPLETED]),
      },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: limit,
    });
    return [...newestFirst].reverse();
  }

  /**
   * Ownership-aware lookup. The user scope is part of the query itself so a
   * foreign id is indistinguishable from a missing one (always 404).
   */
  private async findOwnedSessionOrFail(
    userId: string,
    chatId: string,
  ): Promise<ChatSession> {
    const chat = await this.chatSessionRepository.findOne({
      where: { id: chatId, user: { id: userId } },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found.');
    }

    return chat;
  }
}

/**
 * Explicit role conversion into the provider-independent format. TOOL has
 * no counterpart outside future tool execution, so it is skipped.
 */
function toAiMessages(messages: Message[]): AiChatMessage[] {
  const converted: AiChatMessage[] = [];

  for (const message of messages) {
    const role = toAiRole(message.role);
    if (role) {
      converted.push({ role, content: message.content });
    }
  }

  return converted;
}

function toAiRole(role: MessageRole): AiChatMessage['role'] | null {
  switch (role) {
    case MessageRole.USER:
      return 'user';
    case MessageRole.ASSISTANT:
      return 'assistant';
    case MessageRole.SYSTEM:
      return 'system';
    default:
      return null;
  }
}
