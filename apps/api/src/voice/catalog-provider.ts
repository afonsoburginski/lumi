import { DEFAULT_VOICE_ID, VOICE_PRESETS, findVoicePreset } from '@lumi/shared';

import type { VoiceProvider } from '@/voice/types';

/**
 * Roteador de catálogo: cada preset (ver @lumi/shared/voices) aponta para um
 * vendor (ElevenLabs ou Gemini). Sintetiza no provider certo; se o ElevenLabs
 * falhar (cota/erro), cai no Gemini pra nunca ficar mudo. Clonagem foi removida.
 */
const GEMINI_FALLBACK_VOICE = 'Sulafat';

export function createCatalogVoiceProvider(
  gemini: VoiceProvider,
  eleven: VoiceProvider | null,
): VoiceProvider {
  return {
    name: `catalog(${eleven ? 'elevenlabs+' : ''}gemini)`,
    listPresets: () => VOICE_PRESETS.map(({ id, label }) => ({ id, label })),

    async synthesize(text, voiceId) {
      const preset = findVoicePreset(voiceId) ?? findVoicePreset(DEFAULT_VOICE_ID)!;
      if (preset.vendor === 'elevenlabs' && eleven) {
        try {
          return await eleven.synthesize(text, preset.ref);
        } catch {
          // cota/erro do ElevenLabs → narra com o Gemini (não fica mudo)
          return gemini.synthesize(text, GEMINI_FALLBACK_VOICE);
        }
      }
      // presets Gemini (ou ElevenLabs sem chave) → Gemini
      return gemini.synthesize(text, preset.vendor === 'gemini' ? preset.ref : GEMINI_FALLBACK_VOICE);
    },

    async cloneVoice(): Promise<{ voiceId: string }> {
      throw new Error('Clonagem de voz foi removida.');
    },
  };
}
