import * as FileSystem from 'expo-file-system/legacy';

import { apiFetch } from '@/lib/api/client';
import type { WordTiming } from '@/types/domain';

import {
  findLocalAudio,
  findLocalPreview,
  findManifestAudio,
  localAudioPath,
  localPreviewPath,
  localTimingsPath,
  readLocalTimings,
  type ManifestAudio,
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

/** Baixa um arquivo do R2 pro path local e retorna o uri local. */
async function downloadTo(remoteUrl: string, target: string): Promise<string> {
  await ensureDir(target);
  const res = await FileSystem.downloadAsync(remoteUrl, target);
  return res.uri;
}

/**
 * Usa um item do manifest (URL R2 já existente) — baixa o áudio + timings pro
 * cache local e devolve. NÃO bate em `/voice/synthesize` (não gasta token).
 */
async function consumeManifestEntry(
  storyId: string,
  pageId: string,
  voiceId: string,
  entry: ManifestAudio,
): Promise<RemoteNarration> {
  const audioTarget = localAudioPath(storyId, pageId, voiceId, entry.ext);
  const timingsTarget = localTimingsPath(storyId, pageId, voiceId);
  const audioUri = await downloadTo(entry.audioUrl, audioTarget);
  let wordTimings: WordTiming[] = [];
  let durationMs = 0;
  try {
    await downloadTo(entry.timingsUrl, timingsTarget);
    const meta = await readLocalTimings(storyId, pageId, voiceId);
    if (meta) {
      wordTimings = meta.wordTimings;
      durationMs = meta.durationMs;
    }
  } catch {
    /* sidecar pode faltar — ignora */
  }
  return { audioUri, wordTimings, durationMs };
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
 * Resolve a narração de uma página numa voz específica. Ordem de tentativa
 * (cada nível só dispara o próximo se o anterior falhar):
 *
 * 1. **Arquivo local** já baixado (`documentDirectory/lumi/stories/...`). Offline.
 * 2. **Manifest do R2** — se o servidor já pré-bakeou a (voz, página), pega o
 *    áudio direto do CDN. NÃO gasta token de TTS (a síntese aconteceu antes).
 * 3. **POST /voice/synthesize** — caminho a frio: o servidor sintetiza, salva
 *    no R2 e devolve a URL. Custo: 1 chamada de IA.
 *
 * Resultado é cacheado em 1 (arquivo local) → próximas chamadas pulam 2 e 3.
 */
export async function fetchNarration(input: FetchNarrationInput): Promise<RemoteNarration> {
  const { text, voiceId, storyId, pageId } = input;

  // 1) cache local (story OU preview de voz no profile)
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

    // 2) manifest do R2 (CDN download direto — não bate na síntese)
    const entry = await findManifestAudio(storyId, pageId, voiceId);
    if (entry) {
      try {
        return await consumeManifestEntry(storyId, pageId, voiceId, entry);
      } catch (err) {
        console.warn(
          '[narration] falha ao baixar do manifest, caindo na síntese:',
          err instanceof Error ? err.message : err,
        );
      }
    }
  } else {
    // Preview de voz no profile: reusa o arquivo local da última preview
    // (sample fixo → mesma síntese, zero rede após a 1ª vez).
    const cached = await findLocalPreview(voiceId);
    if (cached) {
      return { audioUri: cached.uri, wordTimings: [], durationMs: 0 };
    }
  }

  // 3) servidor sintetiza → cacheia local
  const data = await apiFetch<SynthesizeResponse>('/voice/synthesize', {
    method: 'POST',
    body: JSON.stringify({ text, voiceId, storyId, pageId }),
  });

  let audioUri: string | undefined;
  let ext: 'mp3' | 'wav' = 'mp3';
  // Resolve o path local de destino — story OU preview de voz.
  const resolveTarget = (audioExt: 'mp3' | 'wav') =>
    storyId && pageId
      ? localAudioPath(storyId, pageId, voiceId, audioExt)
      : localPreviewPath(voiceId, audioExt);

  if (data.audioUrl) {
    ext = extFromUrl(data.audioUrl);
    const target = resolveTarget(ext);
    audioUri = await downloadTo(data.audioUrl, target);
    if (data.timingsUrl && storyId && pageId) {
      const timingsTarget = localTimingsPath(storyId, pageId, voiceId);
      await downloadTo(data.timingsUrl, timingsTarget).catch(() => {});
    }
  } else if (data.audioBase64) {
    ext = extFor(data.mimeType) as 'mp3' | 'wav';
    const target = resolveTarget(ext);
    await ensureDir(target);
    await FileSystem.writeAsStringAsync(target, data.audioBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    audioUri = target;
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
