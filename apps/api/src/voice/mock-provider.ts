import { uniformWordTimings, type Narration, type VoiceProvider, type VoicePreset } from '@/voice/types';

/** Provider offline/dev: sem áudio real, apenas wordTimings para o karaokê. */
const PRESETS: VoicePreset[] = [
  { id: 'preset-epico', label: '🎙️ Narrador Épico' },
  { id: 'preset-fada', label: '🧚 Fada' },
  { id: 'preset-vovo', label: '👴 Vovô' },
];

export function createMockVoiceProvider(): VoiceProvider {
  return {
    name: 'mock',
    listPresets: () => PRESETS,
    async synthesize(text): Promise<Narration> {
      const wordTimings = uniformWordTimings(text);
      return { wordTimings, durationMs: wordTimings.at(-1)?.endMs ?? 0 };
    },
    async cloneVoice(label): Promise<{ voiceId: string }> {
      // Sem provider: devolve um id local; a narração usará um preset como fallback.
      return { voiceId: `local-${label.toLowerCase().replace(/\s+/g, '-')}` };
    },
  };
}
