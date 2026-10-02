import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ResponseMessage } from '@/common/decorators/response-message.decorator.js';
import {
  ApiPaginatedResponse,
  ApiStandardErrorResponses,
  ApiStandardNoContent,
  ApiStandardResponse,
} from '@/common/decorators/swagger/index.js';
import { ChangePasswordDto } from '@/modules/auth/dto/change-password.dto.js';
import { UpdateAccountSettingsDto } from '@/modules/users/dto/update-account-settings.dto.js';
import { UserResponseDto } from '@/modules/users/dto/responses/user-response.dto.js';

const USER_EXAMPLE = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Ava Patel',
  email: 'ava.patel@example.com',
  role: 'user',
  isActive: true,
  emailVerifiedAt: null,
  settings: {
    displayName: 'Ava Patel',
    locale: 'en-US',
    timezone: 'America/New_York',
    notificationEmails: true,
  },
  createdAt: '2026-09-18T10:24:00.000Z',
  updatedAt: '2026-10-01T08:12:44.000Z',
};

/** Single-decorator documentation for self-service account routes. */
export const ApiAccountDocs = {
  getProfile(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Profile retrieved successfully'),
      ApiOperation({
        summary: 'Get the authenticated user profile',
        description: [
          'Returns the caller’s own user record derived from the access JWT (`sub` claim).',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required.',
          '',
          'Business rules:',
          '- Secrets (password / refresh / reset hashes) are never returned.',
          '- Unknown `sub` returns 404 (e.g. account deleted after token issue).',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiStandardResponse({
        type: UserResponseDto,
        status: 200,
        description: 'Profile wrapped in the success envelope.',
        message: 'Profile retrieved successfully',
        exampleData: USER_EXAMPLE,
      }),
      ApiStandardErrorResponses([401, 404, 500]),
    );
  },

  changePassword(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ApiOperation({
        summary: 'Change the authenticated user password',
        description: [
          'Verifies the current password, then sets a new one and revokes all sessions.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required. `Content-Type: application/json` required.',
          '',
          'Business rules:',
          '- `currentPassword` must bcrypt-match or a 401 is returned.',
          '- `newPassword` must satisfy the 12-char complexity rule.',
          '- Success clears refresh + reset token hashes (all devices logged out).',
          '- Responds `204 No Content` with an empty body.',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiBody({ type: ChangePasswordDto }),
      ApiStandardNoContent({
        description: 'Password changed. Empty body.',
        errorStatuses: [400, 401, 500],
      }),
    );
  },

  updateSettings(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Account settings updated successfully'),
      ApiOperation({
        summary: 'Update profile name and preferences',
        description: [
          'Partially updates the caller’s name and display preferences. Only provided fields change.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required. `Content-Type: application/json` required.',
          '',
          'Business rules:',
          '- All fields optional; at least one is expected (empty body is a no-op returning the current user).',
          '- `name` also mirrors into `settings.displayName`.',
          '- `locale` expects BCP-47 (e.g. `en-US`); `timezone` expects IANA (e.g. `America/New_York`).',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiBody({ type: UpdateAccountSettingsDto }),
      ApiStandardResponse({
        type: UserResponseDto,
        status: 200,
        description: 'Updated user wrapped in the success envelope.',
        message: 'Account settings updated successfully',
        exampleData: USER_EXAMPLE,
      }),
      ApiStandardErrorResponses([400, 401, 404, 500]),
    );
  },
};

/** Single-decorator documentation for admin-style user routes. */
export const ApiUsersDocs = {
  findAll(): MethodDecorator & ClassDecorator {
    return applyDecorators(
      ResponseMessage('Users retrieved successfully'),
      ApiOperation({
        summary: 'List users with pagination (newest first)',
        description: [
          'Returns one page of users ordered by `createdAt` descending inside `data.items`, with paging state in `data.meta`.',
          '',
          'Headers: `Authorization: Bearer <accessToken>` required.',
          'Query: `page` (default 1) and `limit` (default 20, max 100).',
          '',
          'Business rules:',
          '- Role-based authorization is not yet enforced — any authenticated user can call this (see roadmap).',
          '- Secrets are stripped from each record.',
        ].join('\n'),
      }),
      ApiBearerAuth('access-jwt'),
      ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        example: 1,
        description: 'Page number, starting at 1.',
      }),
      ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        example: 20,
        description: 'Items per page (1-100).',
      }),
      ApiPaginatedResponse({
        type: UserResponseDto,
        status: 200,
        description: 'Paginated users wrapped in the success envelope.',
        message: 'Users retrieved successfully',
        exampleItems: [USER_EXAMPLE],
      }),
      ApiStandardErrorResponses([400, 401, 403, 500]),
    );
  },
};
