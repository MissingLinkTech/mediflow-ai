import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '@/common/dto/api-response.dto.js';

/** HTTP statuses this project documents as reusable error responses. */
export type StandardErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500;

interface ErrorExample {
  description: string;
  message: string;
  errors?: string[];
}

const TIMESTAMP_EXAMPLE = '2026-10-02T16:10:00.000Z';

const ERROR_EXAMPLES: Record<StandardErrorStatus, ErrorExample> = {
  400: {
    description: 'Bad request — validation failed.',
    message: 'Validation failed',
    errors: ['email must be a valid email address'],
  },
  401: {
    description:
      'Unauthorized — missing, expired, or invalid credentials/token.',
    message: 'Invalid credentials.',
  },
  403: {
    description:
      'Forbidden — authenticated but not allowed to access this resource.',
    message: 'Access denied. Insufficient permissions.',
  },
  404: {
    description: 'Not found — the requested resource does not exist.',
    message: 'User not found.',
  },
  409: {
    description: 'Conflict — resource already exists.',
    message: 'A user with this email already exists.',
  },
  422: {
    description: 'Unprocessable entity — semantically invalid payload.',
    message: 'Unable to process the request',
    errors: [
      'password must include uppercase, lowercase, number, and special character',
    ],
  },
  500: {
    description: 'Internal server error — unexpected failure.',
    message: 'Internal server error',
  },
};

/** Attaches envelope-shaped error responses for the given statuses. */
export function ApiStandardErrorResponses(
  statuses: StandardErrorStatus[] = [400, 401, 404, 500],
): MethodDecorator & ClassDecorator {
  const responses = statuses.map((status) => {
    const example = ERROR_EXAMPLES[status];
    return ApiResponse({
      status,
      description: example.description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiErrorResponseDto) },
          {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              statusCode: { type: 'number', example: status },
              message: { type: 'string', example: example.message },
              ...(example.errors
                ? {
                    errors: {
                      type: 'array',
                      items: { type: 'string' },
                      example: example.errors,
                    },
                  }
                : {}),
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: TIMESTAMP_EXAMPLE,
              },
            },
            required: ['success', 'statusCode', 'message', 'timestamp'],
          },
        ],
        example: {
          success: false,
          statusCode: status,
          message: example.message,
          ...(example.errors ? { errors: example.errors } : {}),
          timestamp: TIMESTAMP_EXAMPLE,
        },
      },
    });
  });

  return applyDecorators(ApiExtraModels(ApiErrorResponseDto), ...responses);
}

/** Documents a `204 No Content` endpoint plus its error responses. */
export function ApiStandardNoContent(options: {
  description: string;
  errorStatuses?: StandardErrorStatus[];
}): MethodDecorator & ClassDecorator {
  const { description, errorStatuses = [400, 401, 404, 500] } = options;
  return applyDecorators(
    ApiResponse({ status: 204, description }),
    ApiStandardErrorResponses(errorStatuses),
  );
}
