import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api/v1', {
    exclude: ['api/docs', 'api/docs-json', 'api/docs-yaml'],
  });
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}

function setupSwagger(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  const config = new DocumentBuilder()
    .setTitle('Mediflow AI API')
    .setDescription(
      [
        'AI-powered health assistant backend.',
        '',
        '## Conventions',
        '- All success bodies use the envelope `{ success, statusCode, message, data, timestamp }`.',
        '- All error bodies use `{ success: false, statusCode, message, errors?, timestamp }`.',
        '- `204 No Content` responses have an empty body (no envelope) by HTTP semantics.',
        '- Protected routes require `Authorization: Bearer <accessToken>` unless noted otherwise.',
        '- `POST /auth/refresh_token` takes the refresh JWT in the `refreshToken` body field (no `Authorization` header needed).',
      ].join('\n'),
    )
    .setVersion('1.0')
    .setTermsOfService('https://mediflow.example.com/terms')
    .setContact(
      'Mediflow API Support',
      'https://mediflow.example.com',
      'support@mediflow.example.com',
    )
    .setLicense('UNLICENSED', 'https://mediflow.example.com/license')
    .addTag('Health', 'Service liveness probes.')
    .addTag(
      'Auth',
      'Signup, login, token rotation, logout, and password recovery (public except logout).',
    )
    .addTag(
      'Account',
      'Self-service profile and settings (access JWT required).',
    )
    .addTag('Users', 'User listing (access JWT required).')
    .addTag(
      'Chats',
      'Chat persistence: sessions, message history, and structured context (access JWT required).',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Short-lived **access JWT** from signup/login/refresh. Example: `Bearer eyJhbGciOi...`',
      },
      'access-jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}

await bootstrap();
