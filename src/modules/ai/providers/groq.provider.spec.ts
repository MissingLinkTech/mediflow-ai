import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AiProviderName } from '../enums/ai-provider-name.enum.js';
import { GroqProvider } from './groq.provider.js';

async function createProvider(values: Record<string, unknown>) {
  const moduleFixture = await Test.createTestingModule({
    providers: [
      GroqProvider,
      {
        provide: ConfigService,
        useValue: { get: vi.fn((key: string) => values[key]) },
      },
    ],
  }).compile();
  return moduleFixture.get<GroqProvider>(GroqProvider);
}

describe('GroqProvider', () => {
  it('fails safely when it is selected without configuration', async () => {
    const provider = await createProvider({});
    await expect(
      provider.generateReply({ messages: [{ role: 'user', content: 'Hi' }] }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('maps common messages and normalizes the response', async () => {
    const provider = await createProvider({ GROQ_API_KEY: 'test-key' });
    const create = vi.fn().mockResolvedValue({
      model: 'groq-model',
      choices: [{ message: { content: 'Hello.' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 4, completion_tokens: 2, total_tokens: 6 },
    });
    (provider as unknown as { client: unknown }).client = {
      chat: { completions: { create } },
    };

    const result = await provider.generateReply({
      systemInstruction: 'Be helpful.',
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Earlier reply' },
      ],
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'Be helpful.' },
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Earlier reply' },
        ],
      }),
      expect.objectContaining({ timeout: 30000 }),
    );
    expect(result).toMatchObject({
      text: 'Hello.',
      provider: AiProviderName.GROQ,
      model: 'groq-model',
      usage: { inputTokens: 4, outputTokens: 2, totalTokens: 6 },
      finishReason: 'stop',
    });
  });
});
