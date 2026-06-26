import { env } from '@/env';
import { createCatalogVoiceProvider } from '@/voice/catalog-provider';
import { createElevenLabsProvider } from '@/voice/elevenlabs-provider';
import { createGeminiVoiceProvider } from '@/voice/gemini-provider';
import { createMockVoiceProvider } from '@/voice/mock-provider';
import type { VoiceProvider } from '@/voice/types';

/**
 * Seleção do provider de voz — catálogo de presets profissionais (ElevenLabs +
 * Gemini), roteando cada preset ao seu vendor (ver @lumi/shared/voices):
 * - Gemini (+ ElevenLabs se houver chave) → catálogo completo, Gemini de fallback.
 * - só ElevenLabs → tudo no ElevenLabs.
 * - nenhum → mock offline.
 */
function selectVoiceProvider(): VoiceProvider {
  const hasGemini = Boolean(env.ai.geminiApiKey);
  const hasEleven = Boolean(env.voice.elevenLabsApiKey);

  if (hasGemini) {
    return createCatalogVoiceProvider(
      createGeminiVoiceProvider(),
      hasEleven ? createElevenLabsProvider() : null,
    );
  }
  if (hasEleven) return createElevenLabsProvider();
  return createMockVoiceProvider();
}

export const voiceProvider: VoiceProvider = selectVoiceProvider();

export type { VoiceProvider, Narration, VoicePreset } from '@/voice/types';
