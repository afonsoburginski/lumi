import { ACTIVE_VOICE_PRESETS, DEFAULT_VOICE_ID, findVoicePreset, type VoiceVendor } from '@lumi/shared';

import type { Narration, VoiceProvider } from '@/voice/types';

/** Estratégia de síntese de um vendor (ElevenLabs ou Gemini). */
export interface VoiceStrategy {
  synthesize(text: string, ref: string): Promise<Narration>;
}

/**
 * Roteador de voz — STRATEGY PATTERN: cada preset (ver @lumi/shared/voices)
 * declara seu vendor; a síntese vai para a estratégia daquele vendor usando o
 * `ref` correto (voice_id do ElevenLabs OU nome da voz Gemini). SEM fallback —
 * se a estratégia do vendor não estiver registrada, erro explícito.
 */
export function createVoiceRouter(
  strategies: Partial<Record<VoiceVendor, VoiceStrategy>>,
): VoiceProvider {
  return {
    name: `router(${Object.keys(strategies).join('+')})`,
    listPresets: () => ACTIVE_VOICE_PRESETS.map(({ id, label }) => ({ id, label })),

    synthesize(text, voiceId) {
      const preset = findVoicePreset(voiceId) ?? findVoicePreset(DEFAULT_VOICE_ID)!;
      const strategy = strategies[preset.vendor];
      if (!strategy) {
        throw new Error(`Sem estratégia de voz para o vendor "${preset.vendor}" (voiceId=${voiceId})`);
      }
      return strategy.synthesize(text, preset.ref);
    },

    async cloneVoice(): Promise<{ voiceId: string }> {
      throw new Error('Clonagem de voz foi removida.');
    },
  };
}
