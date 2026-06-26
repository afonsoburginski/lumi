import { ACTIVE_VOICE_PRESETS, DEFAULT_VOICE_ID, findVoicePreset, type VoiceVendor } from '@lumi/shared';

import type { Narration, VoiceProvider } from '@/voice/types';

/** Estratégia de síntese de um vendor (ElevenLabs ou Gemini). */
export interface VoiceStrategy {
  synthesize(text: string, ref: string): Promise<Narration>;
}

/**
 * Roteador de voz — STRATEGY PATTERN ESTRITO: cada preset (ver
 * @lumi/shared/voices) declara seu vendor; a síntese vai EXCLUSIVAMENTE pra
 * estratégia daquele vendor usando o `ref` correto (voice_id do ElevenLabs OU
 * nome da voz Gemini).
 *
 * SEM FALLBACK CROSS-VENDOR. Se a vendor da voz falhar (cota, 401, rede), o erro
 * é propagado — o cliente decide o que fazer (mostrar voz como indisponível,
 * tentar de novo mais tarde). Antes, o fallback tocava OUTRA voz na mesma key,
 * o que confundia o usuário ("pedi Leda e veio Bella") e poluía o cache R2.
 */
export function createVoiceRouter(
  strategies: Partial<Record<VoiceVendor, VoiceStrategy>>,
): VoiceProvider {
  const available = Object.keys(strategies) as VoiceVendor[];

  return {
    name: `router(${available.join('+')})`,
    listPresets: () => ACTIVE_VOICE_PRESETS.map(({ id, label }) => ({ id, label })),

    async synthesize(text, voiceId): Promise<Narration> {
      const preset = findVoicePreset(voiceId) ?? findVoicePreset(DEFAULT_VOICE_ID)!;
      const strategy = strategies[preset.vendor];
      if (!strategy) {
        throw new Error(`Vendor "${preset.vendor}" não disponível (voiceId=${voiceId})`);
      }
      return strategy.synthesize(text, preset.ref);
    },

    async cloneVoice(): Promise<{ voiceId: string }> {
      throw new Error('Clonagem de voz foi removida.');
    },
  };
}
