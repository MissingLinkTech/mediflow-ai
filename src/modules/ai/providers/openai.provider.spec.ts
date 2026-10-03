import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AiProviderName } from '../enums/ai-provider-name.enum.js';
import { OpenAiProvider } from './openai.provider.js';

async function createProvider(values: Record<string, unknown>) {
  const moduleFixture = await Test.createTestingModule({
    providers: [
      OpenAiProvider,
      {
        provide: ConfigService,
        useValue: { get: vi.fn((key: string) => values[key]) },
      },
    ],
  }).compile();
  return moduleFixture.get<OpenAiProvider>(OpenAiProvider);
}

describe('OpenAiProvider', () => {
  it('fails safely when it is selected without configuration', async () => {
    const provider = await createProvider({});
    await expect(
      provider.generateReply({ messages: [{ role: 'user', content: 'Hi' }] }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('maps common messages and normalizes the response', async () => {
    const provider = await createProvider({ OPENAI_API_KEY: 'test-key' });
    const create = vi.fn().mockResolvedValue({
      model: 'openai-model',
      choices: [{ message: { content: 'Hello.' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
    });
    (provider as unknown as { client: unknown }).client = {
      chat: { completions: { create } },
    };

    const result = await provider.generateReply({
      systemInstruction: 'Be helpful.',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'Be helpful.' },
          { role: 'user', content: 'Hi' },
        ],
      }),
      expect.objectContaining({ timeout: 30000 }),
    );
    expect(result).toMatchObject({
      text: 'Hello.',
      provider: AiProviderName.OPENAI,
      model: 'openai-model',
      usage: { inputTokens: 5, outputTokens: 3, totalTokens: 8 },
      finishReason: 'stop',
    });
  });
});
