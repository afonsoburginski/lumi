import { env } from '@/env';
import { createAnthropicProvider } from '@/ai/anthropic-provider';
import { createMockAiProvider } from '@/ai/mock-provider';
import type { AiProvider } from '@/ai/types';

/** Seleciona o provider de IA: Claude quando há chave, senão mock offline. */
export const aiProvider: AiProvider = env.ai.anthropicApiKey
  ? createAnthropicProvider()
  : createMockAiProvider();

export type { AiProvider, GeneratedStory, GenerateStoryInput } from '@/ai/types';
