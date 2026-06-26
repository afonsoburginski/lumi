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

function extFor(mimeType?: string): string {
  if (mimeType?.includes('wav')) return 'wav';
  if (mimeType?.includes('mpeg') || mimeType?.includes('mp3')) return 'mp3';
  return 'mp3';
}

/**
 * Busca a narração de um texto na API (/voice/synthesize). Quando o provider
 * retorna áudio (Gemini/ElevenLabs), grava em arquivo para o expo-audio tocar;
 * sempre retorna os wordTimings para o karaokê.
 *
 * `cacheKey` (ex.: `${storyId}-${pageId}`) dá nome estável ao arquivo — narração
 * pré-gerada na criação é persistida (documentDirectory) e tocada offline depois.
 */
export async function fetchNarration(
  text: string,
  voiceId: string,
  cacheKey?: string,
): Promise<RemoteNarration> {
  const data = await apiFetch<SynthesizeResponse>('/voice/synthesize', {
    method: 'POST',
    body: JSON.stringify({ text, voiceId }),
  });

  let audioUri: string | undefined;
  if (data.audioBase64) {
    const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
    const name = cacheKey ? `narration-${cacheKey}` : `narration-${Date.now()}`;
    const path = `${dir}${name}.${extFor(data.mimeType)}`;
    await FileSystem.writeAsStringAsync(path, data.audioBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    audioUri = path;
  }
  return { audioUri, wordTimings: data.wordTimings, durationMs: data.durationMs };
}
