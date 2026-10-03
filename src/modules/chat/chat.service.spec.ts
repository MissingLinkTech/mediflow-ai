import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChatService } from './chat.service.js';
import { ChatContext } from './entities/chat-context.entity.js';
import { ChatSession } from './entities/chat-session.entity.js';
import { Message } from './entities/message.entity.js';
import { ChatStatus } from './enums/chat-status.enum.js';
import { ChatType } from './enums/chat-type.enum.js';
import { MessageRole } from './enums/message-role.enum.js';
import { MessageStatus } from './enums/message-status.enum.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const CHAT_ID = '33333333-3333-4333-8333-333333333333';

function seedSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return Object.assign(new ChatSession(), {
    id: CHAT_ID,
    user: { id: USER_ID },
    title: 'Headache follow-up',
    type: ChatType.GENERAL,
    status: ChatStatus.ACTIVE,
    createdAt: new Date('2026-10-03T10:24:00.000Z'),
    updatedAt: new Date('2026-10-03T10:31:12.000Z'),
    ...overrides,
  });
}

function seedContext(): ChatContext {
  return Object.assign(new ChatContext(), {
    id: '44444444-4444-4444-8444-444444444444',
    chatSession: { id: CHAT_ID },
    contextType: 'general',
    contextData: {},
    createdAt: new Date('2026-10-03T10:24:00.000Z'),
    updatedAt: new Date('2026-10-03T10:24:00.000Z'),
  });
}

function seedMessage(overrides: Partial<Message> = {}): Message {
  return Object.assign(new Message(), {
    id: '55555555-5555-4555-8555-555555555555',
    chatSession: { id: CHAT_ID },
    role: MessageRole.USER,
    content: 'I have had headaches for three days.',
    status: MessageStatus.COMPLETED,
    createdAt: new Date('2026-10-03T10:25:00.000Z'),
    updatedAt: new Date('2026-10-03T10:25:00.000Z'),
    ...overrides,
  });
}

function createRepositoryMock() {
  return {
    create: vi.fn((input: unknown) => input),
    save: vi.fn(async (input: Record<string, unknown>) => {
      await Promise.resolve();
      return {
        ...input,
        id: input['id'] ?? 'generated-id',
        createdAt: input['createdAt'] ?? new Date(),
        updatedAt: input['updatedAt'] ?? new Date(),
      };
    }),
    findOne: vi.fn(),
    findAndCount: vi.fn(),
    delete: vi.fn(),
  };
}

describe('ChatService', () => {
  let service: ChatService;
  let sessionRepository: ReturnType<typeof createRepositoryMock>;
  let messageRepository: ReturnType<typeof createRepositoryMock>;
  let contextRepository: ReturnType<typeof createRepositoryMock>;
  let transaction: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    sessionRepository = createRepositoryMock();
    messageRepository = createRepositoryMock();
    contextRepository = createRepositoryMock();

    const manager = {
      getRepository: vi.fn((entity: unknown) => {
        if (entity === ChatSession) {
          return sessionRepository;
        }
        if (entity === Message) {
          return messageRepository;
        }
        return contextRepository;
      }),
    };
    transaction = vi.fn((work: (manager: unknown) => unknown) => work(manager));

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatSession),
          useValue: sessionRepository,
        },
        {
          provide: getRepositoryToken(Message),
          useValue: messageRepository,
        },
        {
          provide: getRepositoryToken(ChatContext),
          useValue: contextRepository,
        },
        { provide: DataSource, useValue: { transaction } },
      ],
    }).compile();

    service = moduleFixture.get<ChatService>(ChatService);
  });

  describe('createChat', () => {
    it('creates a session owned by the caller with defaults', async () => {
      const detail = await service.createChat(USER_ID, {});

      expect(sessionRepository.create).toHaveBeenCalledWith({
        user: { id: USER_ID },
        title: null,
        type: ChatType.GENERAL,
        status: ChatStatus.ACTIVE,
      });
      expect(detail).toMatchObject({ type: ChatType.GENERAL });
      expect(detail.context).toMatchObject({
        contextType: 'general',
        contextData: {},
      });
    });

    it('passes an explicit title and type through', async () => {
      await service.createChat(USER_ID, {
        title: 'Headache follow-up',
        type: ChatType.HEALTH_CONSULTATION,
      });

      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: USER_ID },
          title: 'Headache follow-up',
          type: ChatType.HEALTH_CONSULTATION,
        }),
      );
    });
  });

  describe('listChats', () => {
    it('scopes the listing to the caller and orders by latest activity', async () => {
      const first = seedSession();
      const second = seedSession({ id: 'other-chat-id' });
      sessionRepository.findAndCount.mockResolvedValue([[first, second], 2]);

      const result = await service.listChats(USER_ID, { page: 1, limit: 20 });

      expect(sessionRepository.findAndCount).toHaveBeenCalledWith({
        where: { user: { id: USER_ID } },
        order: { updatedAt: 'DESC', id: 'DESC' },
        skip: 0,
        take: 20,
      });
      expect(result.items).toHaveLength(2);
      expect(result.meta).toMatchObject({
        page: 1,
        limit: 20,
        totalItems: 2,
      });
    });
  });

  describe('getChat', () => {
    it('returns the owned chat with its context', async () => {
      sessionRepository.findOne.mockResolvedValue(seedSession());
      contextRepository.findOne.mockResolvedValue(seedContext());

      const detail = await service.getChat(USER_ID, CHAT_ID);

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: CHAT_ID, user: { id: USER_ID } },
      });
      expect(detail.context).toMatchObject({ contextType: 'general' });
    });

    it('throws 404 when the chat belongs to another user', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(service.getChat(OTHER_USER_ID, CHAT_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(contextRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('updateChat', () => {
    it('updates title and archives an owned chat', async () => {
      sessionRepository.findOne.mockResolvedValue(seedSession());
      contextRepository.findOne.mockResolvedValue(seedContext());

      const detail = await service.updateChat(USER_ID, CHAT_ID, {
        title: 'Renamed',
        status: ChatStatus.ARCHIVED,
      });

      expect(sessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Renamed', status: 'archived' }),
      );
      expect(detail.status).toBe(ChatStatus.ARCHIVED);
    });

    it('throws 404 when updating another user chat', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateChat(OTHER_USER_ID, CHAT_ID, { title: 'Hijacked' }),
      ).rejects.toThrow(NotFoundException);
      expect(sessionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteChat', () => {
    it('deletes an owned chat', async () => {
      sessionRepository.findOne.mockResolvedValue(seedSession());
      sessionRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteChat(USER_ID, CHAT_ID);

      expect(sessionRepository.delete).toHaveBeenCalledWith(CHAT_ID);
    });

    it('throws 404 without deleting when the chat belongs to another user', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteChat(OTHER_USER_ID, CHAT_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(sessionRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('addMessage', () => {
    it('appends a message with defaults and bumps chat activity', async () => {
      sessionRepository.findOne.mockResolvedValue(seedSession());

      const message = await service.addMessage(USER_ID, CHAT_ID, {
        content: 'Mostly on my left side.',
      });

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: CHAT_ID, user: { id: USER_ID } },
      });
      expect(messageRepository.create).toHaveBeenCalledWith({
        chatSession: { id: CHAT_ID },
        role: MessageRole.USER,
        content: 'Mostly on my left side.',
        status: MessageStatus.COMPLETED,
      });
      expect(sessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: CHAT_ID, updatedAt: expect.any(Date) }),
      );
      expect(message).toMatchObject({ role: 'user', status: 'completed' });
    });

    it('throws 404 without writing when the chat belongs to another user', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addMessage(OTHER_USER_ID, CHAT_ID, { content: 'Hello?' }),
      ).rejects.toThrow(NotFoundException);
      expect(messageRepository.create).not.toHaveBeenCalled();
      expect(messageRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('listMessages', () => {
    it('checks ownership first and returns chronological history', async () => {
      sessionRepository.findOne.mockResolvedValue(seedSession());
      const messages = [seedMessage(), seedMessage({ id: 'later-message-id' })];
      messageRepository.findAndCount.mockResolvedValue([messages, 2]);

      const result = await service.listMessages(USER_ID, CHAT_ID, {
        page: 1,
        limit: 20,
      });

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: CHAT_ID, user: { id: USER_ID } },
      });
      expect(messageRepository.findAndCount).toHaveBeenCalledWith({
        where: { chatSession: { id: CHAT_ID } },
        order: { createdAt: 'ASC', id: 'ASC' },
        skip: 0,
        take: 20,
      });
      expect(result.items).toHaveLength(2);
      expect(result.meta.totalItems).toBe(2);
    });

    it('throws 404 without reading messages of another user chat', async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.listMessages(OTHER_USER_ID, CHAT_ID, { page: 1, limit: 20 }),
      ).rejects.toThrow(NotFoundException);
      expect(messageRepository.findAndCount).not.toHaveBeenCalled();
    });
  });
});
