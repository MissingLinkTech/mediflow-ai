import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER } from './ai.constants.js';
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
  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async generateReply(request: AiGenerateRequest): Promise<AiGenerateResult> {
    return await this.provider.generateReply(request);
  }
}
