import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto } from '@/common/dto/api-response.dto.js';

export interface ApiStandardResponseOptions {
  /** Concrete DTO wrapped as `data` inside the envelope. */
  type?: Type<unknown>;
  /** HTTP status code documented for this response. Defaults to 200. */
  status?: number;
  /** Short Swagger summary line shown in the responses section. */
  description: string;
  /** `message` value shown inside the envelope example. */
  message?: string;
  /** Set when `data` is an array of `type`. */
  isArray?: boolean;
  /** Realistic dummy payload embedded in the Swagger example value. */
  exampleData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const TIMESTAMP_EXAMPLE = '2026-10-02T16:10:00.000Z';

/** Documents a successful JSON response wrapped in the success envelope. */
export function ApiStandardResponse(
  options: ApiStandardResponseOptions,
): MethodDecorator & ClassDecorator {
  const {
    type,
    status = 200,
    description,
    message = defaultSuccessMessage(status),
    isArray = false,
    exampleData,
  } = options;

  const dataSchema = type
    ? isArray
      ? {
          type: 'array' as const,
          items: { $ref: getSchemaPath(type) },
        }
      : { $ref: getSchemaPath(type) }
    : { type: 'object' as const, nullable: true as const };

  const models: Array<Type<unknown>> = [ApiResponseDto];
  if (type) {
    models.push(type);
  }

  return applyDecorators(
    ApiExtraModels(...models),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              statusCode: { type: 'number', example: status },
              message: { type: 'string', example: message },
              data: dataSchema,
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: TIMESTAMP_EXAMPLE,
              },
            },
            required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
          },
        ],
        example: {
          success: true,
          statusCode: status,
          message,
          data: exampleData ?? null,
          timestamp: TIMESTAMP_EXAMPLE,
        },
      },
    }),
  );
}

function defaultSuccessMessage(status: number): string {
  if (status === 201) {
    return 'Resource created successfully';
  }
  return 'Request completed successfully';
}
