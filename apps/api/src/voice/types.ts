import type { WordTiming } from '@lumi/shared';

export interface VoicePreset {
  id: string;
  label: string;
}

export interface Narration {
  /** áudio em base64 (data URI montada no cliente); ausente no mock. */
  audioBase64?: string;
  mimeType?: string;
  wordTimings: WordTiming[];
  durationMs: number;
}

/** Opções de síntese — `strict` desliga o fallback cross-vendor (usado no pré-bake). */
export interface SynthesizeOptions {
  strict?: boolean;
}

export interface VoiceProvider {
  readonly name: string;
  listPresets(): VoicePreset[];
  synthesize(text: string, voiceId: string, opts?: SynthesizeOptions): Promise<Narration>;
  /** Clonagem: recebe amostras (base64) e retorna o id da voz no provider. */
  cloneVoice(label: string, samplesBase64: string[]): Promise<{ voiceId: string }>;
}

/** ~360ms por palavra — usado pelo mock e como fallback de alinhamento. */
export const MS_PER_WORD = 360;

export function uniformWordTimings(text: string): WordTiming[] {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((word, i) => ({
    word,
    startMs: i * MS_PER_WORD,
    endMs: (i + 1) * MS_PER_WORD,
  }));
}
