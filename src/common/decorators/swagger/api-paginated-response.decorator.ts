import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto } from '@/common/dto/api-response.dto.js';
import {
  PageMetaDto,
  PaginatedResponseDto,
} from '@/common/dto/paginated-response.dto.js';

export interface ApiPaginatedResponseOptions {
  /** Concrete DTO of each entry in `data.items`. */
  type: Type<unknown>;
  /** HTTP status code documented for this response. Defaults to 200. */
  status?: number;
  /** Short Swagger summary line shown in the responses section. */
  description: string;
  /** `message` value shown inside the envelope example. */
  message?: string;
  /** Realistic dummy items embedded in the Swagger example value. */
  exampleItems?: Array<Record<string, unknown>>;
}

const TIMESTAMP_EXAMPLE = '2026-10-02T16:10:00.000Z';

/** Documents a paginated array response: envelope wrapping `{ items, meta }`. */
export function ApiPaginatedResponse(
  options: ApiPaginatedResponseOptions,
): MethodDecorator & ClassDecorator {
  const {
    type,
    status = 200,
    description,
    message = 'Resources retrieved successfully',
    exampleItems = [],
  } = options;

  const exampleMeta = {
    page: 1,
    limit: 20,
    totalItems: exampleItems.length,
    totalPages: exampleItems.length > 0 ? 1 : 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  return applyDecorators(
    ApiExtraModels(ApiResponseDto, PaginatedResponseDto, PageMetaDto, type),
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
              data: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(type) },
                  },
                  meta: { $ref: getSchemaPath(PageMetaDto) },
                },
                required: ['items', 'meta'],
              },
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
          data: { items: exampleItems, meta: exampleMeta },
          timestamp: TIMESTAMP_EXAMPLE,
        },
      },
    }),
  );
}
