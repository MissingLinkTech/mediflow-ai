import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { type App } from 'supertest/types';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App> | undefined;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new TransformInterceptor(reflector));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('/ (GET)', async () => {
    if (!app) {
      throw new Error('Nest application was not initialized.');
    }

    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.body).toMatchObject({
      success: true,
      statusCode: 200,
      message: 'Service is healthy',
      data: 'Hello World!',
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
  });
});
