import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDERS } from './ai.constants.js';
import { AiService } from './ai.service.js';
import { AiProviderName } from './enums/ai-provider-name.enum.js';
import type {
  AiGenerateRequest,
  AiGenerateResult,
  AiProvider,
} from './interfaces/ai-provider.interface.js';

describe('AiService', () => {
  it('delegates generation to the requested provider', async () => {
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
      providers: [
        AiService,
        { provide: AI_PROVIDERS, useValue: [provider] },
        {
          provide: ConfigService,
          useValue: { get: vi.fn().mockReturnValue(AiProviderName.GEMINI) },
        },
      ],
    }).compile();

    const service = moduleFixture.get<AiService>(AiService);
    await expect(
      service.generateReply(request, AiProviderName.GEMINI),
    ).resolves.toBe(result);
    expect(generateReply).toHaveBeenCalledWith(request);
  });

  it('uses the configured default without falling back to another provider', async () => {
    const request: AiGenerateRequest = {
      messages: [{ role: 'user', content: 'Hello' }],
    };
    const gemini = {
      name: AiProviderName.GEMINI,
      generateReply: vi.fn(),
    } satisfies AiProvider;
    const groqFailure = new Error('Groq failed');
    const groq = {
      name: AiProviderName.GROQ,
      generateReply: vi.fn().mockRejectedValue(groqFailure),
    } satisfies AiProvider;
    const config = {
      get: vi.fn().mockReturnValue(AiProviderName.GROQ),
    } as unknown as ConfigService;
    const service = new AiService([gemini, groq], config);

    await expect(service.generateReply(request)).rejects.toBe(groqFailure);
    expect(groq.generateReply).toHaveBeenCalledWith(request);
    expect(gemini.generateReply).not.toHaveBeenCalled();
  });
});
