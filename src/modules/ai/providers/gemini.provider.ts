import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import type { Content } from '@google/genai';
import {
  DEFAULT_AI_REQUEST_TIMEOUT_MS,
  DEFAULT_GEMINI_MODEL,
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

/**
 * Gemini implementation of {@link AiProvider} using the official
 * `@google/genai` SDK. All provider-specific mapping (roles, usage,
 * finish reasons) lives here; callers only see the provider contract.
 */
@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name = AiProviderName.GEMINI;

  private readonly logger = new Logger(GeminiProvider.name);
  private client: GoogleGenAI | null = null;

  constructor(private readonly configService: ConfigService) {}

  getModel(): string {
    const configured = this.configService.get<string>('GEMINI_MODEL')?.trim();
    if (!configured) {
      return DEFAULT_GEMINI_MODEL;
    }
    return configured;
  }

  async generateReply(request: AiGenerateRequest): Promise<AiGenerateResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY')?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException(AI_NOT_CONFIGURED_MESSAGE);
    }

    const timeoutMs =
      this.configService.get<number>('AI_REQUEST_TIMEOUT_MS') ??
      DEFAULT_AI_REQUEST_TIMEOUT_MS;
    const startedAt = Date.now();

    try {
      const response = await this.getClient(apiKey).models.generateContent({
        model: this.getModel(),
        contents: toGeminiContents(request.messages.map(toRoleAndText)),
        config: {
          systemInstruction: request.systemInstruction,
          httpOptions: { timeout: timeoutMs },
        },
      });

      const text = response.text?.trim();

      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }

      return {
        text,
        provider: this.name,
        model: this.getModel(),
        usage: toUsage(response.usageMetadata),
        finishReason: response.candidates?.[0]?.finishReason,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      throwNormalizedProviderError('Gemini', error, this.logger);
    }
  }

  private getClient(apiKey: string): GoogleGenAI {
    this.client ??= new GoogleGenAI({ apiKey });
    return this.client;
  }
}

function toRoleAndText(message: {
  role: 'user' | 'assistant' | 'system';
  content: string;
}): { role: 'user' | 'model'; text: string } {
  // Gemini contents only accept 'user' | 'model'.
  if (message.role === 'assistant') {
    return { role: 'model', text: message.content };
  }
  return { role: 'user', text: message.content };
}

function toGeminiContents(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
): Content[] {
  return messages.map((message) => ({
    role: message.role,
    parts: [{ text: message.text }],
  }));
}

function toUsage(
  usageMetadata:
    | {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      }
    | undefined,
): AiUsage {
  // Pass through only reported values; never invent counts.
  return {
    ...(typeof usageMetadata?.promptTokenCount === 'number'
      ? { inputTokens: usageMetadata.promptTokenCount }
      : {}),
    ...(typeof usageMetadata?.candidatesTokenCount === 'number'
      ? { outputTokens: usageMetadata.candidatesTokenCount }
      : {}),
    ...(typeof usageMetadata?.totalTokenCount === 'number'
      ? { totalTokens: usageMetadata.totalTokenCount }
      : {}),
  };
}
