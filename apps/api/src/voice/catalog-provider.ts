import { ACTIVE_VOICE_PRESETS, DEFAULT_VOICE_ID, findVoicePreset, type VoiceVendor } from '@lumi/shared';

import type { Narration, SynthesizeOptions, VoiceProvider } from '@/voice/types';

/** Estratégia de síntese de um vendor (ElevenLabs ou Gemini). */
export interface VoiceStrategy {
  synthesize(text: string, ref: string): Promise<Narration>;
}

/**
 * Ref padrão por vendor para FALLBACK. Quando a vendor da voz escolhida falha
 * (ex.: Gemini TTS estoura a cota free de 10/dia → 429), roteamos pra outra
 * vendor disponível com uma voz profissional dela. ElevenLabs → voice_id premade
 * (funciona no free); Gemini → voz prebuilt amistosa.
 */
const FALLBACK_REF: Record<VoiceVendor, string> = {
  elevenlabs: findVoicePreset(DEFAULT_VOICE_ID)?.ref ?? 'hpp4J3VqNfWAUOO0d1Us',
  gemini: 'Achird',
};

/**
 * Roteador de voz — STRATEGY PATTERN: cada preset (ver @lumi/shared/voices)
 * declara seu vendor; a síntese vai para a estratégia daquele vendor usando o
 * `ref` correto (voice_id do ElevenLabs OU nome da voz Gemini).
 *
 * FALLBACK cross-vendor (resiliência — NÃO "voz burra"): se a vendor da voz
 * escolhida falhar (cota/erro), tentamos as demais vendors registradas com a voz
 * padrão delas. A narração NUNCA fica muda pra criança e ambos os lados são voz
 * profissional real (≠ do antigo fallback robótico de expo-speech).
 */
export function createVoiceRouter(
  strategies: Partial<Record<VoiceVendor, VoiceStrategy>>,
): VoiceProvider {
  const available = Object.keys(strategies) as VoiceVendor[];

  return {
    name: `router(${available.join('+')})`,
    listPresets: () => ACTIVE_VOICE_PRESETS.map(({ id, label }) => ({ id, label })),

    async synthesize(text, voiceId, opts: SynthesizeOptions = {}): Promise<Narration> {
      const preset = findVoicePreset(voiceId) ?? findVoicePreset(DEFAULT_VOICE_ID)!;
      // Strict (pré-bake): só a vendor do preset — sem fallback cross-vendor pra
      // não gravar áudio com voz errada na key da voz pedida.
      const order: VoiceVendor[] = opts.strict
        ? [preset.vendor]
        : [preset.vendor, ...available.filter((v) => v !== preset.vendor)];

      let lastErr: unknown;
      for (const vendor of order) {
        const strategy = strategies[vendor];
        if (!strategy) continue;
        const ref = vendor === preset.vendor ? preset.ref : FALLBACK_REF[vendor];
        try {
          return await strategy.synthesize(text, ref);
        } catch (err) {
          lastErr = err;
          console.warn(
            `[voice] vendor "${vendor}" falhou (voiceId=${voiceId}${opts.strict ? ', strict' : ''}) — ${opts.strict ? 'sem fallback' : 'tentando fallback…'}`,
            err instanceof Error ? err.message : err,
          );
        }
      }
      throw lastErr ?? new Error(`Nenhuma estratégia de voz disponível (voiceId=${voiceId})`);
    },

    async cloneVoice(): Promise<{ voiceId: string }> {
      throw new Error('Clonagem de voz foi removida.');
    },
  };
}
