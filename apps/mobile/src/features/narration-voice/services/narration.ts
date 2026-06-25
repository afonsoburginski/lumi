import * as FileSystem from 'expo-file-system/legacy';

import { apiFetch } from '@/lib/api/client';
import type { WordTiming } from '@/types/domain';

export interface RemoteNarration {
  /** caminho de arquivo local para tocar com expo-audio (quando há áudio real) */
  audioUri?: string;
  wordTimings: WordTiming[];
  durationMs: number;
}

interface SynthesizeResponse {
  audioBase64?: string;
  mimeType?: string;
  wordTimings: WordTiming[];
  durationMs: number;
}

/**
 * Busca a narração de um texto na API (/voice/synthesize). Quando o provider
 * retorna áudio (ElevenLabs), grava em arquivo de cache para o expo-audio tocar;
 * sempre retorna os wordTimings para o karaokê.
 */
export async function fetchNarration(text: string, voiceId: string): Promise<RemoteNarration> {
  const data = await apiFetch<SynthesizeResponse>('/voice/synthesize', {
    method: 'POST',
    body: JSON.stringify({ text, voiceId }),
  });

  let audioUri: string | undefined;
  if (data.audioBase64) {
    const path = `${FileSystem.cacheDirectory}narration-${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(path, data.audioBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    audioUri = path;
  }
  return { audioUri, wordTimings: data.wordTimings, durationMs: data.durationMs };
}
