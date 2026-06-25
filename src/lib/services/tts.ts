import type { WordTiming } from '@/lib/story/types';

/**
 * Mod narration-voice — síntese de narração. MOCK offline: não gera áudio real,
 * mas produz os `wordTimings` (karaokê) de forma determinística a partir do texto,
 * simulando ~360ms por palavra. Quando houver provider real, retornar também
 * `audioUri` e timings vindos do TTS/forced-alignment.
 *
 * Ver docs/mods/narration-voice/features/tts-timings.md.
 */
const MS_PER_WORD = 360;

export interface Narration {
  audioUri?: string;
  wordTimings: WordTiming[];
  durationMs: number;
}

export function synthesize(text: string, _voiceId?: string): Narration {
  const words = text.split(/\s+/).filter(Boolean);
  const wordTimings: WordTiming[] = words.map((word, i) => ({
    word,
    startMs: i * MS_PER_WORD,
    endMs: (i + 1) * MS_PER_WORD,
  }));
  return { audioUri: undefined, wordTimings, durationMs: words.length * MS_PER_WORD };
}

/** Aplica narração a uma página inteira (texto -> wordTimings). */
export function narratePages<T extends { text: string }>(
  pages: T[],
  voiceId?: string,
): (T & { wordTimings: WordTiming[] })[] {
  return pages.map((p) => ({ ...p, wordTimings: synthesize(p.text, voiceId).wordTimings }));
}
