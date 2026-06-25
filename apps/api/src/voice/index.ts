import { env } from '@/env';
import { createElevenLabsProvider } from '@/voice/elevenlabs-provider';
import { createMockVoiceProvider } from '@/voice/mock-provider';
import type { VoiceProvider } from '@/voice/types';

/** Seleciona o provider de voz: ElevenLabs quando há chave, senão mock offline. */
export const voiceProvider: VoiceProvider = env.voice.elevenLabsApiKey
  ? createElevenLabsProvider()
  : createMockVoiceProvider();

export type { VoiceProvider, Narration, VoicePreset } from '@/voice/types';
