# Mediflow AI Backend

NestJS + TypeScript API for an AI-powered health assistant. The current codebase is the API foundation — auth, users, chat persistence, and Gemini-powered replies through a provider-independent AI layer. Multi-provider routing, LangChain, LangGraph, and RAG are planned, not implemented.

> Health-related output from future AI features will be informational only — never a substitute for professional medical advice.

## Features

- User registration, login, refresh-token rotation, logout, password reset/change
- Authenticated account profile, settings, and user listing (paginated)
- Chat persistence: user-owned sessions, chronological message history, 1:1 structured context
- Gemini replies via `AiService` → `AiProvider` → `GeminiProvider`, with per-message generation metadata and a bounded recent-history window
- Standardized success/error response envelopes; `204` responses carry no body
- Swagger UI at `/api/docs` with Bearer auth
- Global DTO validation (whitelist + unknown-property rejection)
- TypeORM migrations (chat persistence is the first)
- Vitest unit + e2e tests, ESLint flat config, Prettier

## Tech Stack

Node.js · NestJS 12 · TypeScript 6 (native ESM) · PostgreSQL · TypeORM · `@nestjs/config` · `@nestjs/jwt` · `@google/genai` · `bcrypt` · `class-validator`/`class-transformer` · Vitest/Supertest

## Getting Started

Prerequisites: Node.js (see `.nvmrc`), PostgreSQL.

```bash
npm install
cp .env.example .env   # then fill in secrets
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`

In development (`NODE_ENV=development`) TypeORM synchronizes the schema automatically.

## API Reference

All routes live under `/api/v1`. Protected routes require `Authorization: Bearer <accessToken>`. Array endpoints accept `page` (default `1`) and `limit` (default `20`, max `100`) and return `{ items, meta }`.

| Method | Route                      | Description                                                                              |
| ------ | -------------------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/`                        | Health check                                                                             |
| POST   | `/auth/signup`             | Register; returns user + token pair                                                      |
| POST   | `/auth/login`              | Login; returns user + token pair                                                         |
| POST   | `/auth/refresh_token`      | Rotate refresh token via `refreshToken` body field                                       |
| POST   | `/auth/logout`             | Clear refresh-token hash (`204`)                                                         |
| POST   | `/auth/forgot-password`    | Start password reset (`204`)                                                             |
| POST   | `/auth/reset-password`     | Complete password reset (`204`)                                                          |
| GET    | `/account/profile`         | Authenticated user profile                                                               |
| POST   | `/account/change-password` | Change password, revoke sessions (`204`)                                                 |
| PATCH  | `/account/settings`        | Update profile/settings fields                                                           |
| GET    | `/users`                   | Paginated user listing                                                                   |
| POST   | `/chats`                   | Create caller-owned chat + empty context (`201`)                                         |
| GET    | `/chats`                   | Paginated caller-owned chats, latest activity first                                      |
| GET    | `/chats/:id`               | One caller-owned chat with its context                                                   |
| PATCH  | `/chats/:id`               | Update title/status (`archived` to archive)                                              |
| DELETE | `/chats/:id`               | Hard-delete chat, messages, and context (`204`)                                          |
| POST   | `/chats/:id/messages`      | Send message; returns persisted USER + ASSISTANT pair (`201`, `503` if generation fails) |
| GET    | `/chats/:id/messages`      | Paginated message history, chronological                                                 |

Success bodies use `{ success, statusCode, message, data, timestamp }`; errors use `{ success: false, statusCode, message, errors?, timestamp }`. See Swagger for schemas and examples.

## Project Structure

```text
src/
  main.ts                    Bootstrap, validation pipe, /api/v1 prefix, Swagger
  app.module.ts              Root module
  config/                    Environment validation
  database/                  TypeORM setup + migrations
  common/                    Envelopes, pagination, guards, interceptors, filters, decorators
  modules/
    auth/                    Signup/login/refresh/logout/password flows
    users/                   User listing + account endpoints
    ai/                      Provider-independent AI layer + Gemini provider
    chat/                    Chat sessions, messages, context, generation metadata
test/                        e2e specs (app, auth, users, chat)
```

## Scripts

| Script                 | Description             |
| ---------------------- | ----------------------- |
| `npm run start:dev`    | Start in watch mode     |
| `npm run build`        | Build the application   |
| `npm run test`         | Run unit tests (Vitest) |
| `npm run test:e2e`     | Run e2e tests           |
| `npm run lint`         | Run ESLint              |
| `npm run format`       | Format with Prettier    |
| `npm run format:check` | Check formatting        |

## Environment Variables

See `.env.example`. Database settings and JWT secrets are required; never commit real credentials.

```env
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=
DATABASE_NAME=mediflow_ai_db
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
AI_MAX_HISTORY_MESSAGES=20
AI_REQUEST_TIMEOUT_MS=30000
```

## Roadmap

- [ ] Role-based authorization
- [ ] Migration-based production database lifecycle
- [ ] LangChain/LangGraph workflows, RAG, multi-LLM routing
- [ ] Medical document analysis, Tavily search, specialist discovery, voice

## License

`UNLICENSED` (see `package.json`).
