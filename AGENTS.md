# AGENTS.md

## Project Overview

Mediflow AI Backend is a NestJS 12 + TypeScript backend for an AI-powered health assistant. The current codebase is an early API foundation, not a complete AI assistant.

Existing functionality:

- NestJS API with global prefix `/api/v1`.
- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform`.
- PostgreSQL connection through TypeORM.
- User registration, user listing, login, refresh-token rotation, logout, password reset/change, and account profile/settings endpoints.
- DTO validation with `class-validator`.
- Password hashing with `bcrypt`.
- ESLint flat config, Prettier, Vitest, and Supertest setup.

Partially implemented / not yet wired functionality:

- `User.role` exists, but guards and role-based authorization are not implemented.
- Swagger packages are installed but Swagger setup is not wired into `main.ts`.

Future/planned functionality:

- LangChain, LangGraph, RAG, vector storage, LLM provider routing, Tavily search, medical document analysis, specialist discovery, conversation history, and voice interaction.
- Do not document or implement these as existing features unless the task explicitly adds them.

## Tech Stack

Confirmed from the repository:

- Node.js
- NestJS 12
- TypeScript 6 with `module`/`moduleResolution` set to `nodenext`
- Native ESM via `"type": "module"`
- PostgreSQL
- TypeORM
- `@nestjs/config`
- `@nestjs/jwt`
- `bcrypt`
- `class-validator` and `class-transformer`
- Vitest, Supertest, and `vite-tsconfig-paths`
- ESLint flat config and Prettier

Installed but not fully wired:

- `@nestjs/swagger`, `swagger-ui-express`
- `@nestjs/passport`, `passport`, `passport-jwt`, `passport-local`
- `argon2`

Not currently installed/implemented:

- LangChain
- LangGraph
- OpenAI/Gemini/Groq SDKs
- Tavily
- Vector database client
- Redis
- Docker setup
- Database migrations

## Repository Structure

- `src/main.ts`: Nest bootstrap, global validation pipe, global `/api/v1` prefix.
- `src/app.module.ts`: root module; imports config, database, auth, and users modules.
- `src/database/database.module.ts`: TypeORM PostgreSQL configuration.
- `src/config/env.validation.ts`: startup validation for core environment variables.
- `src/modules/users`: user/account controllers, service, DTOs, and `User` entity.
- `src/modules/auth`: signup, login, refresh, logout, forgot/reset password controller/service/DTOs/strategies.
- `src/common`: shared constants, base entity, enums, interfaces, service, and utilities.
- `test`: e2e starter test.
- Empty placeholder directories exist under `common/guards`, `common/middlewares`, `auth/entities`, and `auth/strategies`; do not treat them as implemented.

## Architecture Guidelines

Follow the current NestJS layering:

Controller -> Service -> Repository/Database or external integration

- Keep controllers thin: request/response handling, decorators, and DTO boundaries only.
- Put business logic in services.
- Use modules for domain boundaries (`AuthModule`, `UsersModule`, future AI modules).
- Use dependency injection; do not manually construct Nest providers.
- Reuse `CommonModule`, `CommonService`, shared constants, enums, and utilities before adding new helpers.
- Keep modules focused. Avoid cross-domain imports unless they reflect a real dependency.
- Avoid speculative abstractions. Add abstractions only when they reduce real duplication or support a requested extension.
- This repo uses ESM-style TypeScript imports with `.js` extensions for relative imports. Preserve that style.
- The `@/*` path alias maps to `src/*`; use it consistently where the existing code does.

## AI Development Rules

Before implementing any task:

1. Read the relevant existing files.
2. Understand the current implementation and incomplete areas.
3. Identify existing patterns to reuse.
4. Determine the minimum files that need modification.
5. Make the smallest correct change.

Do not:

- Refactor unrelated code.
- Rename unrelated symbols or files.
- Reorganize folders unless explicitly requested.
- Upgrade dependencies without being asked.
- Add libraries when existing dependencies or Node/Nest APIs are enough.
- Rewrite working code just because another approach looks cleaner.
- Change public API contracts unrelated to the task.
- Modify database schemas unless the task requires it.
- Create duplicate helpers/services.
- Add roadmap functionality speculatively.
- Weaken TypeScript, ESLint, or validation rules just to silence errors.

Stay strictly within the requested scope. If you find an unrelated issue, mention it separately instead of fixing it automatically.

## Token-Efficient Workflow

Start with the smallest useful context:

- `package.json`
- the relevant module
- the relevant controller/service
- related DTOs/entities
- related tests/config

Expand only when needed. Do not repeatedly read files whose relevant content is already known. Keep implementation updates concise unless the user asks for detailed reasoning.

## TypeScript Guidelines

- Respect the strict TypeScript setup in `tsconfig.json`.
- Prefer strong typing and explicit null/undefined handling.
- Avoid `any`; use `unknown`, concrete interfaces, or library-provided types where appropriate.
- Preserve existing public contracts and response shapes.
- Use `async`/`await` consistently and do not forget to await promises used in conditions.
- Handle promise failures intentionally; do not swallow errors.
- Use `import type` for type-only imports when appropriate.
- Do not suppress TypeScript errors without understanding the underlying cause.

## NestJS Guidelines

- Use DTOs for request payload validation.
- Use services for business logic and persistence orchestration.
- Use Nest exceptions such as `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, and `ConflictException` where appropriate.
- Add guards only when implementing authentication/authorization boundaries.
- Add interceptors or middleware only when they are the right NestJS mechanism for the requested behavior.
- Before creating a provider, check whether `CommonService`, an existing module service, or a framework provider already covers the need.

## DTO and Validation Rules

- Validate external input at API boundaries with DTO classes and `class-validator`.
- Rely on the global validation pipe; do not duplicate simple DTO validation in controllers.
- Use service/domain checks for business rules such as uniqueness, ownership, active account status, and token/session validity.
- Never silently trust client input, LLM output, uploaded documents, or external API responses.

## Database Guidelines

The project currently uses TypeORM with PostgreSQL.

- Inspect existing entities before changing persistence behavior.
- Preserve the `User` fields that store password, refresh-token, and reset-token hashes.
- Register entities with `TypeOrmModule.forFeature(...)` in the module that injects their repositories.
- There are no migrations yet. Do not invent migration conventions or generate migrations unless requested.
- `synchronize` is enabled only in development. Do not enable destructive schema behavior for production.
- Never delete, reset, or rewrite data unless the user explicitly requests it.
- Avoid returning sensitive fields such as password hashes from API responses.

## Authentication & Security

Treat authentication and health-related information as sensitive.

Never:

- Hardcode secrets.
- Expose JWTs, refresh tokens, API keys, or passwords in logs.
- Commit `.env` values or real credentials.
- Return password hashes or sensitive internals from APIs.
- Log medical documents, raw health conversations, or unnecessary PHI.

Use `ConfigService` and environment variables for secrets. Preserve existing auth endpoint paths and response shapes unless the task explicitly changes them. When extending auth, verify refresh-token rotation, token-hash clearing, reset-token expiration, and guard boundaries carefully.

## AI / LLM Guidelines

There are no current AI modules or LangChain/LangGraph dependencies in the repo. If a task adds AI capabilities:

- Create clear module boundaries instead of mixing AI logic into auth/users.
- Preserve provider abstraction; avoid hard-coding business logic to one LLM provider.
- Keep prompts maintainable and versionable.
- Validate structured LLM output before trusting it.
- Handle provider timeouts, rate limits, and API failures.
- Avoid sending unnecessary user health data to external services.
- Keep retrieved evidence distinguishable from generated content.
- Do not treat LLM output as deterministic application logic.

## Healthcare AI Safety

This project targets health-related use cases.

When implementing AI workflows:

- Do not present generated responses as verified diagnoses.
- Preserve uncertainty where appropriate.
- Do not fabricate medical sources.
- Preserve source attribution for retrieved information.
- Make it clear when content is retrieved evidence versus model-generated text.
- Avoid leaking health information into logs, prompts, traces, or third-party tools.
- Minimize exposure of personal health data to external services.

## Error Handling

- Follow existing Nest exception patterns.
- Do not expose stack traces or internal details through API responses.
- Do not add broad `try/catch` blocks unless they translate errors meaningfully.
- Do not swallow errors silently.
- Prefer clear error messages that do not leak secrets or sensitive records.

## Logging

Use NestJS logging conventions if logging is needed. There is no custom logging system yet.

Never log:

- Passwords or password hashes.
- JWTs or refresh tokens.
- API keys or secrets.
- Sensitive medical documents.
- Raw private health conversations unless explicitly approved and redacted.

## Testing

Current tests use Vitest:

- Unit specs: `**/*.spec.ts`
- E2E specs: `**/*.e2e-spec.ts`
- `vite-tsconfig-paths` handles path aliases.

When tests are requested:

- Test behavior rather than implementation details.
- Cover important success and error paths.
- Avoid brittle mocks.
- Do not delete or weaken tests to make a change pass.
- Do not modify unrelated tests.

## Linting & Formatting

Use the existing tooling:

- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

ESLint uses flat config in `eslint.config.mjs` with typed TypeScript rules and `eslint-config-prettier`. Prettier uses single quotes, trailing commas, and `endOfLine: auto`.

Run only the validation commands appropriate for the task. For documentation-only changes, a Prettier check on the changed Markdown file is usually enough.

## Dependency Rules

Before installing a package:

1. Check whether the functionality already exists in the project.
2. Check whether Node.js, NestJS, TypeORM, or current dependencies can handle it.
3. Confirm the dependency is required by the task.

Never upgrade unrelated dependencies. Never replace an existing library without explicit instruction.

## Environment Variables

Current environment variables are documented in `.env.example` and README.

- Follow existing uppercase snake-case naming.
- Update `.env.example` when adding a required variable.
- Never add real credentials.
- Keep validation in `src/config/env.validation.ts` aligned with truly required startup variables.
- JWT variables are used by auth even though only database/core variables are currently validated at startup.

## API Compatibility

Avoid breaking existing API contracts.

Do not change endpoint paths, request DTOs, response shapes, status codes, or authentication requirements unless the task explicitly asks for it.

Current routes use global prefix `/api/v1`:

- `GET /api/v1`
- `POST /api/v1/users`
- `GET /api/v1/users`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh_token`

## Scope Control

For every task, identify:

Requested change -> Relevant files -> Minimum implementation -> Validation

If you discover unrelated bugs, security issues, or architectural gaps, report them separately unless they block the requested change.

## Before Finishing

Review the diff and verify:

- Only relevant files changed.
- No unrelated refactoring occurred.
- No secrets were introduced.
- No debugging code remains.
- Existing architecture was respected.
- Types remain correct.
- Error handling is appropriate.
- Public APIs were not accidentally changed.
- Documentation was updated only when needed.
- New dependencies were added only when necessary.

Run appropriate existing validation commands when allowed by the task.

## Git Rules

Do not commit, push, rebase, reset, force-push, or modify Git history unless explicitly requested. Never run destructive Git commands automatically.

## Communication

When completing a task, provide a concise summary with:

- what changed
- files changed
- important architectural decisions
- validation performed
- tests/build/lint status
- anything requiring developer attention

Keep explanations short unless the user asks for detail.
