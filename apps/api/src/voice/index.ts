import { env } from '@/env';
import { createElevenLabsProvider } from '@/voice/elevenlabs-provider';
import { createGeminiVoiceProvider } from '@/voice/gemini-provider';
import { createHybridVoiceProvider } from '@/voice/hybrid-provider';
import { createMockVoiceProvider } from '@/voice/mock-provider';
import type { VoiceProvider } from '@/voice/types';

/**
 * Seleção do provider de voz:
 * - Gemini + ElevenLabs → híbrido (presets no Gemini, voz clonada no ElevenLabs).
 * - só Gemini → presets premium (clonagem indisponível).
 * - só ElevenLabs → tudo no ElevenLabs.
 * - nenhum → mock offline (só wordTimings do karaokê).
 */
function selectVoiceProvider(): VoiceProvider {
  const hasGemini = Boolean(env.ai.geminiApiKey);
  const hasEleven = Boolean(env.voice.elevenLabsApiKey);

  if (hasGemini && hasEleven) {
    return createHybridVoiceProvider(createGeminiVoiceProvider(), createElevenLabsProvider());
  }
  if (hasGemini) return createGeminiVoiceProvider();
  if (hasEleven) return createElevenLabsProvider();
  return createMockVoiceProvider();
}

export const voiceProvider: VoiceProvider = selectVoiceProvider();

export type { VoiceProvider, Narration, VoicePreset } from '@/voice/types';
