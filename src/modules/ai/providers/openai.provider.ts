import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import {
  DEFAULT_AI_REQUEST_TIMEOUT_MS,
  DEFAULT_OPENAI_MODEL,
} from '../ai.constants.js';
import { AiProviderName } from '../enums/ai-provider-name.enum.js';
import type {
  AiGenerateRequest,
  AiGenerateResult,
  AiProvider,
  AiUsage,
} from '../interfaces/ai-provider.interface.js';
import {
  AI_NOT_CONFIGURED_MESSAGE,
  throwNormalizedProviderError,
} from './provider-error.js';

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = AiProviderName.OPENAI;

  private readonly logger = new Logger(OpenAiProvider.name);
  private client: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {}

  getModel(): string {
    const configured = this.configService.get<string>('OPENAI_MODEL')?.trim();
    if (!configured) {
      return DEFAULT_OPENAI_MODEL;
    }
    return configured;
  }

  async generateReply(request: AiGenerateRequest): Promise<AiGenerateResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(AI_NOT_CONFIGURED_MESSAGE);
    }

    const startedAt = Date.now();
    try {
      const response = await this.getClient(apiKey).chat.completions.create(
        {
          model: this.getModel(),
          messages: toMessages(request),
        },
        {
          timeout:
            this.configService.get<number>('AI_REQUEST_TIMEOUT_MS') ??
            DEFAULT_AI_REQUEST_TIMEOUT_MS,
        },
      );
      const text = response.choices[0]?.message.content?.trim();
      if (!text) {
        throw new Error('OpenAI returned an empty response.');
      }

      return {
        text,
        provider: this.name,
        model: response.model || this.getModel(),
        usage: toUsage(response.usage),
        finishReason: response.choices[0]?.finish_reason ?? undefined,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      throwNormalizedProviderError('OpenAI', error, this.logger);
    }
  }

  private getClient(apiKey: string): OpenAI {
    this.client ??= new OpenAI({ apiKey });
    return this.client;
  }
}

function toMessages(request: AiGenerateRequest): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [];
  if (request.systemInstruction) {
    messages.push({ role: 'system', content: request.systemInstruction });
  }
  messages.push(...request.messages);
  return messages;
}

function toUsage(
  usage:
    | {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      }
    | undefined,
): AiUsage {
  return {
    ...(typeof usage?.prompt_tokens === 'number'
      ? { inputTokens: usage.prompt_tokens }
      : {}),
    ...(typeof usage?.completion_tokens === 'number'
      ? { outputTokens: usage.completion_tokens }
      : {}),
    ...(typeof usage?.total_tokens === 'number'
      ? { totalTokens: usage.total_tokens }
      : {}),
  };
}
