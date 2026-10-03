import { Module } from '@nestjs/common';
import { AI_PROVIDERS } from './ai.constants.js';
import { AiService } from './ai.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { GroqProvider } from './providers/groq.provider.js';
import { OpenAiProvider } from './providers/openai.provider.js';

@Module({
  providers: [
    GeminiProvider,
    GroqProvider,
    OpenAiProvider,
    {
      provide: AI_PROVIDERS,
      useFactory: (
        gemini: GeminiProvider,
        groq: GroqProvider,
        openAi: OpenAiProvider,
      ) => [gemini, groq, openAi],
      inject: [GeminiProvider, GroqProvider, OpenAiProvider],
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
