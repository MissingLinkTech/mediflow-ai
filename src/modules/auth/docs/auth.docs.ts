import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from '@/common/decorators/response-message.decorator.js';
import {
  ApiStandardErrorResponses,
  ApiStandardNoContent,
  ApiStandardResponse,
} from '@/common/decorators/swagger/index.js';
import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto.js';
import { LoginDto } from '@/modules/auth/dto/login.dto.js';
import { RefreshTokenDto } from '@/modules/auth/dto/refresh-token.dto.js';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto.js';
import { SignUpDto } from '@/modules/auth/dto/sign-up.dto.js';
import {
  AuthResponseDto,
  TokenPairResponseDto,
} from '@/modules/auth/dto/responses/auth-response.dto.js';

const AUTH_RESPONSE_EXAMPLE = {
  user: {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Ava Patel',
    email: 'ava.patel@example.com',
    role: 'user',
    isActive: true,
    emailVerifiedAt: null,
    settings: {},
    createdAt: '2026-09-18T10:24:00.000Z',
    updatedAt: '2026-10-01T08:12:44.000Z',
  },
  accessToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDdhYzEwYi01OGNjLTQzNzItYTU2Ny0wZTAyYjJjM2Q0NzkiLCJlbWFpbCI6ImF2YS5wYXRlbEBleGFtcGxlLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJqdGkiOiIxMmFiMzRkNS02NjdjLTQ4YTktOWYxMi0zNDU2Nzg5MGFiY2QiLCJpYXQiOjE3NTk0NjMwMDAsImV4cCI6MTc1OTQ2MzkwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  refreshToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDdhYzEwYi01OGNjLTQzNzItYTU2Ny0wZTAyYjJjM2Q0NzkiLCJlbWFpbCI6ImF2YS5wYXRlbEBleGFtcGxlLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiandsaSI6ImFiYzEyMzQ1LTY3ODktYWJjZC1lZmdoLWlqa2xtbm9wcXJzIiwiaWF0IjoxNzU5NDYzMDAwLCJleHAiOjE3NjAwNjc4MDB9.8K7mNpX2vR4sT9uVw0xYzAbCdEfGhIjKlMnOpQrStU',
};

const TOKEN_PAIR_EXAMPLE = {
  accessToken: AUTH_RESPONSE_EXAMPLE.accessToken,
  refreshToken: AUTH_RESPONSE_EXAMPLE.refreshToken,
};

/** Single-decorator Swagger documentation for every auth route. */
export const ApiAuthDocs = {
  signUp(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('User registered successfully'),
      ApiOperation({
        summary: 'Register a new user account',
        description: [
          'Creates a user and immediately issues an access + refresh token pair.',
          '',
          'Headers: none (public route). `Content-Type: application/json` required.',
          '',
          'Business rules:',
          '- Email is trimmed, lower-cased, and must be unique (else 409).',
          '- Optional `name` (2-100 chars); blank becomes `null`.',
          '- `password` must be 12-128 chars with uppercase, lowercase, number, and special character.',
          '- Password is stored as a bcrypt hash; refresh token hash is persisted for rotation.',
        ].join('\n'),
      }),
      ApiBody({ type: SignUpDto }),
      ApiStandardResponse({
        type: AuthResponseDto,
        status: 201,
        description: 'User registered. Envelope wraps the user + token pair.',
        message: 'User registered successfully',
        exampleData: AUTH_RESPONSE_EXAMPLE,
      }),
      ApiStandardErrorResponses([400, 409, 422, 500]),
    );
  },

  login(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Login successful'),
      ApiOperation({
        summary: 'Authenticate with email and password',
        description: [
          'Validates credentials and issues a fresh access + refresh token pair.',
          '',
          'Headers: none (public route). `Content-Type: application/json` required.',
          '',
          'Business rules:',
          '- Email lookup is case-insensitive; unknown emails still run a dummy bcrypt compare (timing-safe) and return 401.',
          '- Deactivated accounts (`isActive: false`) also return 401.',
          '- Successful login rotates and persists the refresh-token hash.',
        ].join('\n'),
      }),
      ApiBody({ type: LoginDto }),
      ApiStandardResponse({
        type: AuthResponseDto,
        status: 200,
        description: 'Authenticated. Envelope wraps the user + token pair.',
        message: 'Login successful',
        exampleData: AUTH_RESPONSE_EXAMPLE,
      }),
      ApiStandardErrorResponses([400, 401, 500]),
    );
  },

  refreshToken(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Tokens refreshed successfully'),
      ApiOperation({
        summary: 'Rotate the refresh-token pair',
        description: [
          'Validates the refresh JWT and issues a new access + refresh pair (rotation).',
          '',
          'Headers: none beyond `Content-Type: application/json`. The refresh JWT travels in the `refreshToken` body field (extracted via `JwtRefreshStrategy`).',
          '',
          'Business rules:',
          '- `JwtRefreshGuard` rejects missing/expired/mistyped body tokens with 401 before the service runs.',
          '- Body token must bcrypt-match the stored hash; mismatch returns 401.',
          '- Every successful call invalidates the previous refresh token.',
        ].join('\n'),
      }),
      ApiBody({ type: RefreshTokenDto }),
      ApiStandardResponse({
        type: TokenPairResponseDto,
        status: 200,
        description: 'Rotated token pair wrapped in the success envelope.',
        message: 'Tokens refreshed successfully',
        exampleData: TOKEN_PAIR_EXAMPLE,
      }),
      ApiStandardErrorResponses([400, 401, 500]),
    );
  },

  logout(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ApiOperation({
        summary: 'Log out the current session',
        description: [
          'Clears the stored refresh-token hash so the current refresh token can no longer be rotated.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required.',
          '',
          'Business rules:',
          '- Responds `204 No Content` with an empty body (no envelope — HTTP forbids a 204 body).',
          '- Idempotent: logging out twice still returns 204.',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiStandardNoContent({
        description: 'Logged out. Empty body.',
        errorStatuses: [401, 500],
      }),
    );
  },

  forgotPassword(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ApiOperation({
        summary: 'Request a password-reset email',
        description: [
          'Creates a single-use opaque reset token (SHA-256 hashed, 30-minute TTL) and queues a reset email.',
          '',
          'Headers: none (public route). `Content-Type: application/json` required.',
          '',
          'Business rules:',
          '- Always returns `204 No Content` — even for unknown emails — to prevent account enumeration.',
          '- Only an existing account triggers token persistence + email dispatch.',
        ].join('\n'),
      }),
      ApiBody({ type: ForgotPasswordDto }),
      ApiStandardNoContent({
        description:
          'Reset email queued (or silently skipped for unknown email). Empty body.',
        errorStatuses: [400, 500],
      }),
    );
  },

  resetPassword(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ApiOperation({
        summary: 'Reset password with a reset token',
        description: [
          'Consumes the opaque reset token from the forgot-password email and sets a new password.',
          '',
          'Headers: none (public route). `Content-Type: application/json` required.',
          '',
          'Business rules:',
          '- Token is SHA-256 compared (timing-safe) and must not be expired (30 min TTL).',
          '- New password must satisfy the 12-char complexity rule.',
          '- Success clears refresh + reset token hashes (all sessions revoked).',
          '- Responds `204 No Content` with an empty body.',
        ].join('\n'),
      }),
      ApiBody({ type: ResetPasswordDto }),
      ApiStandardNoContent({
        description: 'Password reset. Empty body.',
        errorStatuses: [400, 500],
      }),
    );
  },
};
