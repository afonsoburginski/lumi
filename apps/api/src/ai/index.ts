import { env } from '@/env';
import { createGeminiProvider } from '@/ai/gemini-provider';
import { createMockAiProvider } from '@/ai/mock-provider';
import type { AiProvider } from '@/ai/types';

/** Seleciona o provider de IA: Gemini quando há chave, senão mock offline. */
export const aiProvider: AiProvider = env.ai.geminiApiKey
  ? createGeminiProvider()
  : createMockAiProvider();

export type { AiProvider, GeneratedStory, GenerateStoryInput } from '@/ai/types';
