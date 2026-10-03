import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDERS } from './ai.constants.js';
import { AiProviderName } from './enums/ai-provider-name.enum.js';
import type {
  AiGenerateRequest,
  AiGenerateResult,
  AiProvider,
} from './interfaces/ai-provider.interface.js';

/**
 * Provider-independent orchestration entry point for AI generation.
 * Delegates to the bound {@link AiProvider}; chat code never touches a
 * concrete provider or its SDK.
 */
@Injectable()
export class AiService {
  private readonly providers: ReadonlyMap<AiProviderName, AiProvider>;

  constructor(
    @Inject(AI_PROVIDERS) providers: AiProvider[],
    private readonly configService: ConfigService,
  ) {
    this.providers = new Map(
      providers.map((provider) => [provider.name, provider]),
    );
  }

  async generateReply(
    request: AiGenerateRequest,
    requestedProvider?: AiProviderName,
  ): Promise<AiGenerateResult> {
    const providerName =
      requestedProvider ??
      this.configService.get<AiProviderName>('DEFAULT_AI_PROVIDER') ??
      AiProviderName.GEMINI;
    const provider = this.providers.get(providerName);

    if (!provider) {
      // Environment validation prevents this at startup; keep the boundary safe
      // for isolated module usage and tests as well.
      throw new Error(`AI provider '${providerName}' is not registered.`);
    }

    return await provider.generateReply(request);
  }
}
