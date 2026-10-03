import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AiProviderName } from '../enums/ai-provider-name.enum.js';
import { GeminiProvider } from './gemini.provider.js';

function createConfigService(values: Record<string, unknown>) {
  return { get: vi.fn((key: string) => values[key]) };
}

async function createProvider(values: Record<string, unknown>) {
  const moduleFixture = await Test.createTestingModule({
    providers: [
      GeminiProvider,
      { provide: ConfigService, useValue: createConfigService(values) },
    ],
  }).compile();
  return moduleFixture.get<GeminiProvider>(GeminiProvider);
}

/** Replaces the lazily built SDK client so no network is touched. */
function stubSdkClient(
  provider: GeminiProvider,
  generateContent: ReturnType<typeof vi.fn>,
) {
  const sdkClient = { models: { generateContent } };
  (provider as unknown as { client: unknown }).client = sdkClient;
  return generateContent;
}

describe('GeminiProvider', () => {
  it('is identified as the gemini provider', async () => {
    const provider = await createProvider({ GEMINI_API_KEY: 'test-key' });
    expect(provider.name).toBe(AiProviderName.GEMINI);
  });

  it('fails safely without calling the API when the key is missing', async () => {
    const provider = await createProvider({});
    const generateContent = vi.fn();
    stubSdkClient(provider, generateContent);

    await expect(
      provider.generateReply({ messages: [{ role: 'user', content: 'Hi' }] }),
    ).rejects.toThrow(ServiceUnavailableException);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('maps roles, usage, and finish reason from a successful response', async () => {
    const provider = await createProvider({ GEMINI_API_KEY: 'test-key' });
    const generateContent = stubSdkClient(
      provider,
      vi.fn().mockResolvedValue({
        text: 'Hello there.',
        usageMetadata: {
          promptTokenCount: 7,
          candidatesTokenCount: 3,
          totalTokenCount: 10,
        },
        candidates: [{ finishReason: 'STOP' }],
      }),
    );

    const result = await provider.generateReply({
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello.' },
        { role: 'system', content: 'Context.' },
      ],
      systemInstruction: 'Be helpful.',
    });

    expect(result.text).toBe('Hello there.');
    expect(result.provider).toBe(AiProviderName.GEMINI);
    expect(result.model).toBe('gemini-3.8-flash');
    expect(result.usage).toEqual({
      inputTokens: 7,
      outputTokens: 3,
      totalTokens: 10,
    });
    expect(result.finishReason).toBe('STOP');
    expect(typeof result.latencyMs).toBe('number');
    expect(generateContent).toHaveBeenCalledWith({
      model: 'gemini-3.8-flash',
      contents: [
        { role: 'user', parts: [{ text: 'Hi' }] },
        { role: 'model', parts: [{ text: 'Hello.' }] },
        { role: 'user', parts: [{ text: 'Context.' }] },
      ],
      config: expect.objectContaining({ systemInstruction: 'Be helpful.' }),
    });
  });

  it('uses the configured model when set', async () => {
    const provider = await createProvider({
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-3-flash-preview',
    });
    const generateContent = stubSdkClient(
      provider,
      vi.fn().mockResolvedValue({ text: 'ok' }),
    );

    const result = await provider.generateReply({
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.model).toBe('gemini-3-flash-preview');
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-3-flash-preview' }),
    );
  });

  it('treats an empty model response as a safe failure', async () => {
    const provider = await createProvider({ GEMINI_API_KEY: 'test-key' });
    stubSdkClient(provider, vi.fn().mockResolvedValue({ text: '   ' }));

    await expect(
      provider.generateReply({ messages: [{ role: 'user', content: 'Hi' }] }),
    ).rejects.toThrow(
      'AI assistance is temporarily unavailable. Please try again.',
    );
  });

  it('maps SDK errors to a generic failure without leaking details', async () => {
    const provider = await createProvider({ GEMINI_API_KEY: 'test-key' });
    stubSdkClient(
      provider,
      vi.fn().mockRejectedValue(new Error(' reshaping API_KEY=secret boom')),
    );

    const failure = await provider
      .generateReply({ messages: [{ role: 'user', content: 'Hi' }] })
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ServiceUnavailableException);
    expect((failure as Error).message).toBe(
      'AI assistance is temporarily unavailable. Please try again.',
    );
    expect(JSON.stringify(failure)).not.toContain('secret');
  });
});
