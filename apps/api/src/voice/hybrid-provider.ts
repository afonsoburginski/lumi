import type { VoiceProvider } from '@/voice/types';

/**
 * Roteador de voz: presets (`preset-*`) sintetizam no provider premium (Gemini),
 * vozes clonadas (qualquer outro id = voice_id do ElevenLabs) sintetizam e clonam
 * no provider de clonagem (ElevenLabs). Assim a voz da família "liga" sozinha
 * quando a conta ElevenLabs for upgradada — sem mudança de código.
 */
export function createHybridVoiceProvider(
  presetProvider: VoiceProvider,
  cloneProvider: VoiceProvider,
): VoiceProvider {
  return {
    name: `hybrid(${presetProvider.name}+${cloneProvider.name})`,
    listPresets: () => presetProvider.listPresets(),
    synthesize: (text, voiceId) =>
      voiceId.startsWith('preset-')
        ? presetProvider.synthesize(text, voiceId)
        : cloneProvider.synthesize(text, voiceId),
    cloneVoice: (label, samplesBase64) => cloneProvider.cloneVoice(label, samplesBase64),
  };
}
