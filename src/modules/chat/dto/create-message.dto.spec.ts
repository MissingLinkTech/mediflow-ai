import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AiProviderName } from '@/modules/ai/enums/ai-provider-name.enum.js';
import { CreateMessageDto } from './create-message.dto.js';

describe('CreateMessageDto', () => {
  it('accepts a supported provider override', async () => {
    const dto = plainToInstance(CreateMessageDto, {
      content: 'Hello',
      provider: AiProviderName.GROQ,
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an arbitrary provider identifier', async () => {
    const dto = plainToInstance(CreateMessageDto, {
      content: 'Hello',
      provider: 'random-ai',
    });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'provider')).toBe(true);
  });
});
