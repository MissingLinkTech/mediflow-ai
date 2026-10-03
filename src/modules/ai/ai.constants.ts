/** Injection token for all registered provider implementations. */
export const AI_PROVIDERS = 'AI_PROVIDERS';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
export const DEFAULT_OPENAI_MODEL = 'gpt-5-mini';

/** Fallback history window when `AI_MAX_HISTORY_MESSAGES` is unset. */
export const DEFAULT_AI_MAX_HISTORY_MESSAGES = 20;

/** Fallback per-request timeout (ms) when `AI_REQUEST_TIMEOUT_MS` is unset. */
export const DEFAULT_AI_REQUEST_TIMEOUT_MS = 30000;

/**
 * Centralized system instruction for the MediFlow health assistant.
 * Intentionally a single constant — no prompt-management framework yet.
 */
export const MEDIFLOW_SYSTEM_INSTRUCTION = [
  'You are MediFlow AI, a health information assistant.',
  'Provide general health information and educational guidance, and ask relevant follow-up questions when details are missing.',
  'Never claim certainty about a medical diagnosis and always communicate uncertainty clearly.',
  'Recommend professional medical evaluation where appropriate.',
  'When the conversation indicates potentially serious or emergency symptoms, advise urgent or emergency care.',
  'Do not fabricate medical facts, sources, or statistics.',
].join(' ');
