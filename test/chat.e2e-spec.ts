import {
  type INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { ChatController } from '../src/modules/chat/chat.controller.js';
import { ChatService } from '../src/modules/chat/chat.service.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const CHAT_ID = '33333333-3333-4333-8333-333333333333';

function seedChat() {
  return {
    id: CHAT_ID,
    title: 'Headache follow-up',
    type: 'general',
    status: 'active',
    createdAt: '2026-10-03T10:24:00.000Z',
    updatedAt: '2026-10-03T10:31:12.000Z',
    context: {
      id: '44444444-4444-4444-8444-444444444444',
      contextType: 'general',
      contextData: {},
      createdAt: '2026-10-03T10:24:00.000Z',
      updatedAt: '2026-10-03T10:24:00.000Z',
    },
  };
}

function seedMessage() {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    role: 'user',
    content: 'I have had headaches for three days.',
    status: 'completed',
    createdAt: '2026-10-03T10:25:00.000Z',
    updatedAt: '2026-10-03T10:25:00.000Z',
  };
}

function createChatServiceMock() {
  return {
    createChat: vi.fn(),
    listChats: vi.fn(),
    getChat: vi.fn(),
    updateChat: vi.fn(),
    deleteChat: vi.fn(),
    addMessage: vi.fn(),
    listMessages: vi.fn(),
  };
}

describe('Chats (e2e)', () => {
  let app: INestApplication<App> | undefined;
  let chatService: ReturnType<typeof createChatServiceMock>;

  beforeEach(async () => {
    chatService = createChatServiceMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: chatService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { user?: unknown } };
        }) => {
          context.switchToHttp().getRequest().user = {
            sub: USER_ID,
            email: 'ava.patel@example.com',
            type: 'access',
            jti: 'test-jti',
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(
      new TransformInterceptor(reflector),
      new ClassSerializerInterceptor(reflector),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  function http() {
    if (!app) {
      throw new Error('Nest application was not initialized.');
    }
    return request(app.getHttpServer());
  }

  it('creates a chat for the authenticated user', async () => {
    chatService.createChat.mockResolvedValue(seedChat());

    const response = await http()
      .post('/api/v1/chats')
      .send({ title: 'Headache follow-up', type: 'general' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Chat created successfully');
    expect(response.body.data.id).toBe(CHAT_ID);
    expect(chatService.createChat).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ title: 'Headache follow-up' }),
    );
  });

  it('rejects an overlong title with the error envelope', async () => {
    const response = await http()
      .post('/api/v1/chats')
      .send({ title: 'x'.repeat(201) })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed');
    expect(chatService.createChat).not.toHaveBeenCalled();
  });

  it('lists chats with pagination', async () => {
    chatService.listChats.mockResolvedValue({
      items: [seedChat()],
      meta: {
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    const response = await http().get('/api/v1/chats').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
    expect(chatService.listChats).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it('returns one owned chat', async () => {
    chatService.getChat.mockResolvedValue(seedChat());

    const response = await http().get(`/api/v1/chats/${CHAT_ID}`).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(CHAT_ID);
    expect(chatService.getChat).toHaveBeenCalledWith(USER_ID, CHAT_ID);
  });

  it('maps a foreign chat to the 404 error envelope', async () => {
    chatService.getChat.mockRejectedValue(
      new NotFoundException('Chat not found.'),
    );

    const response = await http().get(`/api/v1/chats/${CHAT_ID}`).expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Chat not found.');
  });

  it('rejects a non-UUID chat id', async () => {
    const response = await http().get('/api/v1/chats/not-a-uuid').expect(400);

    expect(response.body.success).toBe(false);
    expect(chatService.getChat).not.toHaveBeenCalled();
  });

  it('updates an owned chat', async () => {
    chatService.updateChat.mockResolvedValue({
      ...seedChat(),
      status: 'archived',
    });

    const response = await http()
      .patch(`/api/v1/chats/${CHAT_ID}`)
      .send({ status: 'archived' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('archived');
    expect(chatService.updateChat).toHaveBeenCalledWith(
      USER_ID,
      CHAT_ID,
      expect.objectContaining({ status: 'archived' }),
    );
  });

  it('deletes an owned chat with an empty 204 body', async () => {
    chatService.deleteChat.mockResolvedValue(undefined);

    const response = await http()
      .delete(`/api/v1/chats/${CHAT_ID}`)
      .expect(204);

    expect(response.text).toBe('');
    expect(chatService.deleteChat).toHaveBeenCalledWith(USER_ID, CHAT_ID);
  });

  it('adds a message to an owned chat', async () => {
    chatService.addMessage.mockResolvedValue(seedMessage());

    const response = await http()
      .post(`/api/v1/chats/${CHAT_ID}/messages`)
      .send({ content: 'I have had headaches for three days.' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Message added successfully');
    expect(chatService.addMessage).toHaveBeenCalledWith(
      USER_ID,
      CHAT_ID,
      expect.objectContaining({
        content: 'I have had headaches for three days.',
      }),
    );
  });

  it('rejects a blank message with the error envelope', async () => {
    const response = await http()
      .post(`/api/v1/chats/${CHAT_ID}/messages`)
      .send({ content: '   ' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(chatService.addMessage).not.toHaveBeenCalled();
  });

  it('lists message history with pagination', async () => {
    chatService.listMessages.mockResolvedValue({
      items: [seedMessage()],
      meta: {
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    const response = await http()
      .get(`/api/v1/chats/${CHAT_ID}/messages`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
    expect(chatService.listMessages).toHaveBeenCalledWith(
      USER_ID,
      CHAT_ID,
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });
});
