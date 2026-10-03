import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto.js';
import {
  PageMetaDto,
  PaginatedResponseDto,
} from '@/common/dto/paginated-response.dto.js';
import { User } from '@/modules/users/entities/user.entity.js';
import { CreateChatDto } from './dto/create-chat.dto.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { UpdateChatDto } from './dto/update-chat.dto.js';
import { ChatContext } from './entities/chat-context.entity.js';
import { ChatSession } from './entities/chat-session.entity.js';
import { Message } from './entities/message.entity.js';
import { ChatStatus } from './enums/chat-status.enum.js';
import { ChatType } from './enums/chat-type.enum.js';
import { MessageRole } from './enums/message-role.enum.js';
import { MessageStatus } from './enums/message-status.enum.js';

/** A chat session together with its 1:1 structured context. */
export interface ChatDetail extends ChatSession {
  context: ChatContext | null;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly chatSessionRepository: Repository<ChatSession>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ChatContext)
    private readonly chatContextRepository: Repository<ChatContext>,
    private readonly dataSource: DataSource,
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
    // Messages and the 1:1 context are removed by ON DELETE CASCADE.
    await this.chatSessionRepository.delete(chat.id);
  }

  async addMessage(
    userId: string,
    chatId: string,
    dto: CreateMessageDto,
  ): Promise<Message> {
    return this.dataSource.transaction(async (manager) => {
      const sessionRepository = manager.getRepository(ChatSession);
      const messageRepository = manager.getRepository(Message);

      const chat = await sessionRepository.findOne({
        where: { id: chatId, user: { id: userId } },
      });

      if (!chat) {
        throw new NotFoundException('Chat not found.');
      }

      const message = await messageRepository.save(
        messageRepository.create({
          chatSession: { id: chat.id } as ChatSession,
          role: dto.role ?? MessageRole.USER,
          content: dto.content,
          status: dto.status ?? MessageStatus.COMPLETED,
        }),
      );

      // Adding a message is activity: keep latest-activity ordering accurate.
      chat.updatedAt = new Date();
      await sessionRepository.save(chat);

      return message;
    });
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
