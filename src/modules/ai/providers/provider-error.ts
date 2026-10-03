import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Logger } from '@nestjs/common';

export const AI_UNAVAILABLE_MESSAGE =
  'AI assistance is temporarily unavailable. Please try again.';
export const AI_NOT_CONFIGURED_MESSAGE =
  'The selected AI provider is not configured.';

interface ProviderErrorDetails {
  name?: unknown;
  status?: unknown;
  code?: unknown;
}

/** Converts SDK failures to safe HTTP exceptions without logging prompts or keys. */
export function throwNormalizedProviderError(
  providerName: string,
  error: unknown,
  logger: Logger,
): never {
  if (
    error instanceof ServiceUnavailableException ||
    error instanceof GatewayTimeoutException
  ) {
    throw error;
  }

  const details =
    typeof error === 'object' && error !== null
      ? (error as ProviderErrorDetails)
      : undefined;
  const errorName =
    typeof details?.name === 'string' ? details.name : 'UnknownError';
  const status =
    typeof details?.status === 'number' ? details.status : undefined;
  const code = typeof details?.code === 'string' ? details.code : undefined;

  logger.warn(
    `${providerName} request failed (${[
      errorName,
      status === undefined ? undefined : `status=${status}`,
      code === undefined ? undefined : `code=${code}`,
    ]
      .filter(Boolean)
      .join(', ')})`,
  );

  if (
    status === 408 ||
    status === 504 ||
    code === 'ETIMEDOUT' ||
    errorName.toLowerCase().includes('timeout')
  ) {
    throw new GatewayTimeoutException(
      'The AI provider timed out. Please try again.',
    );
  }

  throw new ServiceUnavailableException(AI_UNAVAILABLE_MESSAGE);
}
