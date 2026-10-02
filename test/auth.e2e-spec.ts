/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/promise-function-async */

import {
  ClassSerializerInterceptor,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { type App } from 'supertest/types';
import { AuthController } from '../src/modules/auth/auth.controller.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { JwtRefreshStrategy } from '../src/modules/auth/strategies/jwt-refresh.strategy.js';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy.js';
import { AccountController } from '../src/modules/users/account.controller.js';
import {
  User,
  type UserSettings,
} from '../src/modules/users/entities/user.entity.js';
import { UsersService } from '../src/modules/users/users.service.js';

type MutableUser = User & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  settings?: UserSettings;
};

function createUserRepository() {
  const users = new Map<string, User>();

  return {
    create(data: Partial<User>): User {
      return Object.assign(new User(), data);
    },

    save(user: MutableUser): Promise<User> {
      const now = new Date();
      user.id ??= randomUUID();
      user.createdAt ??= now;
      user.updatedAt = now;
      user.isActive ??= true;
      user.settings ??= {};
      users.set(user.id, user);
      return Promise.resolve(user);
    },

    findOne(options: { where: Partial<User> }): Promise<User | null> {
      const entries = [...users.values()];
      const where = options.where;
      return Promise.resolve(
        entries.find((user) =>
          Object.entries(where).every(
            ([key, value]) => user[key as keyof User] === value,
          ),
        ) ?? null,
      );
    },

    find(): Promise<User[]> {
      return Promise.resolve(
        [...users.values()].sort(
          (first, second) =>
            second.createdAt.getTime() - first.createdAt.getTime(),
        ),
      );
    },

    update(id: string, partial: Partial<User>): Promise<void> {
      const user = users.get(id);

      if (!user) {
        return Promise.resolve();
      }

      Object.assign(user, partial, { updatedAt: new Date() });
      users.set(id, user);
      return Promise.resolve();
    },
  };
}

describe('Authentication lifecycle (e2e)', () => {
  let app: INestApplication<App> | undefined;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({}), JwtModule.register({})],
      controllers: [AuthController, AccountController],
      providers: [
        AuthService,
        UsersService,
        JwtStrategy,
        JwtRefreshStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const values: Record<string, string> = {
                JWT_ACCESS_SECRET: 'test-access-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return values[key];
            },
            getOrThrow: (key: string) => {
              const values: Record<string, string> = {
                JWT_ACCESS_SECRET: 'test-access-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              const value = values[key];

              if (!value) {
                throw new Error(`Missing config value: ${key}`);
              }

              return value;
            },
          },
        },
        {
          provide: getRepositoryToken(User),
          useFactory: createUserRepository,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('supports signup, login, refresh, password change, and authenticated profile access', async () => {
    const email = 'Patient.One@Example.com';
    const password = 'StrongPass123!';
    const newPassword = 'BetterPass123!';

    if (!app) {
      throw new Error('Nest application was not initialized.');
    }

    const server = app.getHttpServer();

    const signUpResponse = await request(server)
      .post('/api/v1/auth/signup')
      .send({ name: 'Patient One', email, password })
      .expect(201);

    expect(signUpResponse.body.accessToken).toEqual(expect.any(String));
    expect(signUpResponse.body.refreshToken).toEqual(expect.any(String));
    expect(signUpResponse.body.user.email).toBe('patient.one@example.com');
    expect(signUpResponse.body.user.passwordHash).toBeUndefined();
    expect(signUpResponse.body.user.refreshTokenHash).toBeUndefined();

    const loginResponse = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: ' patient.one@example.com ', password })
      .expect(200);

    expect(loginResponse.body.accessToken).toEqual(expect.any(String));
    expect(loginResponse.body.refreshToken).toEqual(expect.any(String));

    const refreshResponse = await request(server)
      .post('/api/v1/auth/refresh_token')
      .send({ refreshToken: loginResponse.body.refreshToken })
      .expect(200);

    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken,
    );

    await request(server)
      .post('/api/v1/account/change-password')
      .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
      .send({ currentPassword: password, newPassword })
      .expect(204);

    await request(server)
      .post('/api/v1/auth/refresh_token')
      .send({ refreshToken: refreshResponse.body.refreshToken })
      .expect(401);

    await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(401);

    const newLoginResponse = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password: newPassword })
      .expect(200);

    const profileResponse = await request(server)
      .get('/api/v1/account/profile')
      .set('Authorization', `Bearer ${newLoginResponse.body.accessToken}`)
      .expect(200);

    expect(profileResponse.body.email).toBe('patient.one@example.com');
    expect(profileResponse.body.passwordHash).toBeUndefined();
    expect(profileResponse.body.refreshTokenHash).toBeUndefined();
  }, 20000);
});
