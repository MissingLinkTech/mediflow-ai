import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable, map } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '@/common/decorators/response-message.decorator.js';
import type { ApiResponseDto } from '@/common/dto/api-response.dto.js';

/** Wraps successful JSON payloads into the standard success envelope. */
@Injectable()
export class TransformInterceptor<T = unknown> implements NestInterceptor<
  T,
  ApiResponseDto<T | null>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseDto<T | null>> {
    const http = context.switchToHttp();
    const response = http.getResponse<Response>();
    const handler = context.getHandler();

    const customMessage = this.reflector.get<string | undefined>(
      RESPONSE_MESSAGE_KEY,
      handler,
    );

    return next.handle().pipe(
      map((rawData: T): ApiResponseDto<T | null> => {
        const statusCode = response.statusCode;
        const method = http.getRequest<{ method: string }>().method;

        if (statusCode === 204) {
          return rawData as unknown as ApiResponseDto<T | null>;
        }

        if (isEnvelope(rawData)) {
          return rawData as unknown as ApiResponseDto<T | null>;
        }

        const message = customMessage ?? defaultMessageFor(method, statusCode);

        return {
          success: true,
          statusCode,
          message,
          data: rawData ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

function isEnvelope(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['success'] === 'boolean' &&
    typeof candidate['statusCode'] === 'number' &&
    typeof candidate['timestamp'] === 'string'
  );
}

function defaultMessageFor(method: string, statusCode: number): string {
  if (statusCode === 201) {
    return 'Resource created successfully';
  }
  switch (method.toUpperCase()) {
    case 'POST':
      return 'Action completed successfully';
    case 'PATCH':
    case 'PUT':
      return 'Resource updated successfully';
    case 'DELETE':
      return 'Resource deleted successfully';
    default:
      return 'Resource retrieved successfully';
  }
}
