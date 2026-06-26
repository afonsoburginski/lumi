import * as FileSystem from 'expo-file-system/legacy';

import { apiFetch } from '@/lib/api/client';
import type { WordTiming } from '@/types/domain';

import {
  findLocalAudio,
  localAudioPath,
  localTimingsPath,
  readLocalTimings,
} from './prefetch';

export interface RemoteNarration {
  /** caminho de arquivo local para tocar com expo-audio (quando há áudio real) */
  audioUri?: string;
  wordTimings: WordTiming[];
  durationMs: number;
}

interface SynthesizeResponse {
  /** URL pública (R2/CDN) quando o servidor tem storage; baixamos p/ tocar offline. */
  audioUrl?: string;
  /** URL pública do sidecar JSON com timings (quando vier do R2). */
  timingsUrl?: string;
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

function extFromUrl(url: string): 'mp3' | 'wav' {
  return url.toLowerCase().endsWith('.wav') ? 'wav' : 'mp3';
}

async function ensureDir(uri: string): Promise<void> {
  const dir = uri.slice(0, uri.lastIndexOf('/'));
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
}

export interface FetchNarrationInput {
  text: string;
  voiceId: string;
  /** Quando informados, a busca usa o cache local da história e o servidor
   * salva o áudio em `stories/<id>/audio/<voiceId>/<pageId>` no R2. */
  storyId?: string;
  pageId?: string;
}

/**
 * Resolve a narração de uma página numa voz específica. Ordem de tentativa:
 *
 * 1. Arquivo local (já pré-baixado pelo `prefetchStoryAudios` ou cache de chamada
 *    anterior). Tocou offline.
 * 2. `POST /voice/synthesize` com `storyId`/`pageId` → servidor devolve URL do R2
 *    ou base64 inline; baixamos pro mesmo path local e cacheamos os timings.
 *
 * Sempre retorna `wordTimings` (mesmo no caso 1, lendo o sidecar JSON).
 */
export async function fetchNarration(input: FetchNarrationInput): Promise<RemoteNarration> {
  const { text, voiceId, storyId, pageId } = input;

  // 1) cache local (path padronizado com prefetch)
  if (storyId && pageId) {
    const local = await findLocalAudio(storyId, pageId, voiceId);
    if (local) {
      const meta = await readLocalTimings(storyId, pageId, voiceId);
      return {
        audioUri: local.uri,
        wordTimings: meta?.wordTimings ?? [],
        durationMs: meta?.durationMs ?? 0,
      };
    }
  }

  // 2) servidor → cache local
  const data = await apiFetch<SynthesizeResponse>('/voice/synthesize', {
    method: 'POST',
    body: JSON.stringify({ text, voiceId, storyId, pageId }),
  });

  let audioUri: string | undefined;
  let ext: 'mp3' | 'wav' = 'mp3';
  if (data.audioUrl) {
    ext = extFromUrl(data.audioUrl);
    const target =
      storyId && pageId
        ? localAudioPath(storyId, pageId, voiceId, ext)
        : `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}narration-${Date.now()}.${ext}`;
    await ensureDir(target);
    const res = await FileSystem.downloadAsync(data.audioUrl, target);
    audioUri = res.uri;
    if (data.timingsUrl && storyId && pageId) {
      const timingsTarget = localTimingsPath(storyId, pageId, voiceId);
      await ensureDir(timingsTarget);
      await FileSystem.downloadAsync(data.timingsUrl, timingsTarget).catch(() => {});
    }
  } else if (data.audioBase64) {
    ext = extFor(data.mimeType) as 'mp3' | 'wav';
    const target =
      storyId && pageId
        ? localAudioPath(storyId, pageId, voiceId, ext)
        : `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}narration-${Date.now()}.${ext}`;
    await ensureDir(target);
    await FileSystem.writeAsStringAsync(target, data.audioBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    audioUri = target;
    // sem URL de timings vindo do servidor — escrevemos um sidecar local
    if (storyId && pageId) {
      const timingsTarget = localTimingsPath(storyId, pageId, voiceId);
      await ensureDir(timingsTarget);
      await FileSystem.writeAsStringAsync(
        timingsTarget,
        JSON.stringify({ ext, wordTimings: data.wordTimings, durationMs: data.durationMs }),
      ).catch(() => {});
    }
  }
  return { audioUri, wordTimings: data.wordTimings, durationMs: data.durationMs };
}
