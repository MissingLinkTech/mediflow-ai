import { Test, type TestingModule } from '@nestjs/testing';
import { AI_PROVIDER } from './ai.constants.js';
import { AiService } from './ai.service.js';
import { AiProviderName } from './enums/ai-provider-name.enum.js';
import type {
  AiGenerateRequest,
  AiGenerateResult,
  AiProvider,
} from './interfaces/ai-provider.interface.js';

describe('AiService', () => {
  it('delegates generation to the bound provider untouched', async () => {
    const request: AiGenerateRequest = {
      messages: [{ role: 'user', content: 'Hello' }],
      systemInstruction: 'Be helpful.',
    };
    const result: AiGenerateResult = {
      text: 'Hi there.',
      provider: AiProviderName.GEMINI,
      model: 'gemini-3.8-flash',
      usage: {},
      latencyMs: 5,
    };
    const generateReply = vi.fn().mockResolvedValue(result);
    const provider: AiProvider = {
      name: AiProviderName.GEMINI,
      generateReply,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [AiService, { provide: AI_PROVIDER, useValue: provider }],
    }).compile();

    const service = moduleFixture.get<AiService>(AiService);
    await expect(service.generateReply(request)).resolves.toBe(result);
    expect(generateReply).toHaveBeenCalledWith(request);
  });
});
