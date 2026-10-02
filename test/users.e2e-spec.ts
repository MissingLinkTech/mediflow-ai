/* eslint-disable @typescript-eslint/promise-function-async */

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { type App } from 'supertest/types';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';
import { User } from '../src/modules/users/entities/user.entity.js';
import { UsersController } from '../src/modules/users/users.controller.js';
import { UsersService } from '../src/modules/users/users.service.js';

function seedUsers(): User[] {
  const base = Date.now();
  return [0, 1, 2].map((index) =>
    Object.assign(new User(), {
      id: randomUUID(),
      name: `User ${index}`,
      email: `user${index}@example.com`,
      createdAt: new Date(base - index * 1000),
      updatedAt: new Date(base - index * 1000),
      isActive: true,
      settings: {},
    }),
  );
}

function createUserRepository(users: User[]) {
  const sorted = [...users].sort(
    (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
  );
  return {
    findAndCount(options: {
      skip?: number;
      take?: number;
    }): Promise<[User[], number]> {
      const items = sorted.slice(
        options.skip ?? 0,
        (options.skip ?? 0) + (options.take ?? sorted.length),
      );
      return Promise.resolve([items, sorted.length]);
    },
  };
}

describe('Users pagination (e2e)', () => {
  let app: INestApplication<App> | undefined;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: () => createUserRepository(seedUsers()),
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
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

  it('returns paginated users with meta by default', async () => {
    if (!app) {
      throw new Error('Nest application was not initialized.');
    }

    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(3);
    expect(response.body.data.meta).toEqual({
      page: 1,
      limit: 20,
      totalItems: 3,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('honors page and limit query params', async () => {
    if (!app) {
      throw new Error('Nest application was not initialized.');
    }

    const response = await request(app.getHttpServer())
      .get('/api/v1/users?page=2&limit=1')
      .expect(200);

    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].email).toBe('user1@example.com');
    expect(response.body.data.meta).toEqual({
      page: 2,
      limit: 1,
      totalItems: 3,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('rejects invalid pagination params with the error envelope', async () => {
    if (!app) {
      throw new Error('Nest application was not initialized.');
    }

    const response = await request(app.getHttpServer())
      .get('/api/v1/users?page=0')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed');
  });
});
