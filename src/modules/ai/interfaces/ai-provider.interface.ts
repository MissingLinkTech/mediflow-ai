import type { AiProviderName } from '../enums/ai-provider-name.enum.js';

/** Provider-independent turn in a conversation, oldest first. */
export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Everything a provider needs to generate one reply. */
export interface AiGenerateRequest {
  /** Recent conversation history in chronological order. */
  messages: AiChatMessage[];
  /** Steering instructions for the model, if the provider supports them. */
  systemInstruction?: string;
}

/** Token usage as reported by the provider. All fields optional: providers
 *  are not required to report usage, and values must never be invented. */
export interface AiUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

/** One generated reply with the metadata needed for persistence. */
export interface AiGenerateResult {
  text: string;
  provider: AiProviderName;
  model: string;
  usage: AiUsage;
  finishReason?: string;
  latencyMs: number;
}

/**
 * Minimal generation contract. Phase 5 providers (OpenAI, Groq) implement
 * this interface and are bound to {@link AI_PROVIDER} without touching
 * chat business logic.
 */
export interface AiProvider {
  readonly name: AiProviderName;
  generateReply(request: AiGenerateRequest): Promise<AiGenerateResult>;
}
