import { Module } from '@nestjs/common';
import { AI_PROVIDER } from './ai.constants.js';
import { AiService } from './ai.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';

@Module({
  providers: [
    GeminiProvider,
    { provide: AI_PROVIDER, useExisting: GeminiProvider },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
