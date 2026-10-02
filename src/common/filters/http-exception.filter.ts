import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorResponseDto } from '@/common/dto/api-response.dto.js';

interface ValidationPipePayload {
  message?: unknown;
  error?: string;
  statusCode?: number;
}

/** Formats thrown exceptions into the standard error envelope. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const normalized = this.normalize(exception);
    const body: ApiErrorResponseDto = {
      success: false,
      statusCode: normalized.statusCode,
      message: normalized.message,
      ...(normalized.errors ? { errors: normalized.errors } : {}),
      timestamp: new Date().toISOString(),
    };

    response.status(normalized.statusCode).json(body);
  }

  private normalize(exception: unknown): {
    statusCode: number;
    message: string;
    errors?: string[];
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (isValidationPipePayload(body)) {
        const details = toStringArray(body.message);
        if (details) {
          return {
            statusCode,
            message:
              statusCode === 400
                ? 'Validation failed'
                : 'Request failed validation',
            errors: details,
          };
        }
      }

      if (typeof body === 'string') {
        return { statusCode, message: body };
      }

      if (typeof body === 'object') {
        const record = body as Record<string, unknown>;
        const rawMessage = record['message'];
        const details = toStringArray(rawMessage);
        if (details) {
          return {
            statusCode,
            message: statusCode === 400 ? 'Validation failed' : details[0],
            errors:
              details.length > 1 || statusCode === 400 ? details : undefined,
          };
        }
        if (typeof rawMessage === 'string' && rawMessage.length > 0) {
          return { statusCode, message: rawMessage };
        }
        if (typeof record['error'] === 'string' && record['error'].length > 0) {
          return { statusCode, message: record['error'] };
        }
      }

      return { statusCode, message: exception.message || 'Request failed' };
    }

    const message =
      exception instanceof Error ? exception.message : 'Unknown error';
    this.logger.error(
      `Unhandled exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}

function isValidationPipePayload(
  value: unknown,
): value is ValidationPipePayload {
  return typeof value === 'object' && value !== null && 'message' in value;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const details: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      return undefined;
    }
    details.push(item);
  }
  return details.length > 0 ? details : undefined;
}
