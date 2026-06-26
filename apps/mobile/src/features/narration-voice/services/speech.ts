import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

/**
 * Narração on-device via TTS do sistema (expo-speech). Grátis, offline, PT-BR.
 * Os presets de voz viram combinações de pitch/rate — não dependem de uma voz
 * específica do aparelho (que varia por device), garantindo som em qualquer um.
 *
 * pause()/resume() nativos só existem no iOS/web; no Android o controller
 * emula "pausar" parando e re-falando a partir da palavra atual.
 */

export interface SpeechParams {
  language: string;
  pitch: number;
  rate: number;
}

const FALLBACK: SpeechParams = { language: 'pt-BR', pitch: 1.0, rate: 0.95 };

const PRESET_PARAMS: Record<string, SpeechParams> = {
  'preset-epico': { language: 'pt-BR', pitch: 0.8, rate: 0.9 },
  'preset-fada': { language: 'pt-BR', pitch: 1.4, rate: 1.05 },
  'preset-vovo': { language: 'pt-BR', pitch: 0.7, rate: 0.85 },
};

/** Parâmetros do TTS para um voiceId (preset ou voz clonada → fallback neutro). */
export function paramsForVoice(voiceId: string): SpeechParams {
  return PRESET_PARAMS[voiceId] ?? FALLBACK;
}

/** pause()/resume() nativos do expo-speech só funcionam no iOS. */
export const pauseResumeSupported = Platform.OS === 'ios';

export interface SpeakCallbacks {
  onStart?: () => void;
  /** charIndex (offset em chars no texto falado) ao alcançar uma palavra. */
  onBoundary?: (charIndex: number) => void;
  /** Fala terminou naturalmente (≠ parada manual). */
  onDone?: () => void;
  /** Fala interrompida via stop() (troca de página, pausa no Android etc.). */
  onStopped?: () => void;
  onError?: (error: unknown) => void;
}

/** Fala `text` com os parâmetros do preset. */
export function speak(text: string, voiceId: string, cb: SpeakCallbacks = {}): void {
  const p = paramsForVoice(voiceId);
  Speech.speak(text, {
    language: p.language,
    pitch: p.pitch,
    rate: p.rate,
    onStart: cb.onStart,
    onDone: cb.onDone,
    onStopped: cb.onStopped,
    onError: cb.onError,
    onBoundary: cb.onBoundary
      ? (e: { charIndex: number }) => cb.onBoundary?.(e.charIndex)
      : undefined,
  });
}

export function stop(): void {
  Speech.stop();
}

export function pause(): void {
  if (pauseResumeSupported) Speech.pause();
  else Speech.stop();
}

export function resume(): void {
  if (pauseResumeSupported) Speech.resume();
}
