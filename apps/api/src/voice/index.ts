import type { VoiceVendor } from '@lumi/shared';

import { env } from '@/env';
import { createVoiceRouter, type VoiceStrategy } from '@/voice/catalog-provider';
import { createElevenLabsProvider } from '@/voice/elevenlabs-provider';
import { createGeminiVoiceProvider } from '@/voice/gemini-provider';
import { createMockVoiceProvider } from '@/voice/mock-provider';
import type { VoiceProvider } from '@/voice/types';

/**
 * Seleção do provider de voz (strategy pattern): registra uma estratégia por
 * vendor disponível (Gemini se há GEMINI_API_KEY; ElevenLabs se há a chave) e
 * roteia cada preset ao seu vendor — sem fallback. Sem chave nenhuma → mock.
 */
function selectVoiceProvider(): VoiceProvider {
  const strategies: Partial<Record<VoiceVendor, VoiceStrategy>> = {};
  if (env.ai.geminiApiKey) strategies.gemini = createGeminiVoiceProvider();
  if (env.voice.elevenLabsApiKey) strategies.elevenlabs = createElevenLabsProvider();

  if (Object.keys(strategies).length === 0) return createMockVoiceProvider();
  return createVoiceRouter(strategies);
}

export const voiceProvider: VoiceProvider = selectVoiceProvider();

export type { VoiceProvider, Narration, VoicePreset } from '@/voice/types';
