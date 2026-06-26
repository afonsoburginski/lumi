import * as FileSystem from 'expo-file-system/legacy';

import type { VoicePresetDef } from '@lumi/shared';

import { apiFetch } from '@/lib/api/client';
import type { WordTiming } from '@/types/domain';

/**
 * Pré-baixa as narrações de uma história em TODAS as vozes ativas do catálogo.
 *
 * Lê o manifest `/stories/:id/manifest` (`audioByVoice`) e baixa cada combinação
 * (voiceId × pageId) que o servidor já pré-bakeou no R2. Os arquivos ficam em
 * `documentDirectory/lumi/stories/<storyId>/audio/<voiceId>/<pageId>.<ext>` e o
 * sidecar de timings ao lado (`.json`). Idempotente: pula tudo que já existe.
 *
 * O player (`narration.ts`) prefere esses arquivos locais antes de chamar a API,
 * permitindo trocar voz offline depois da 1ª abertura.
 */

interface ManifestAudio {
  pageId: string;
  audioUrl: string;
  timingsUrl: string;
  ext: string;
}

interface StoryManifest {
  storyId: string;
  version: number;
  cover: { url: string } | null;
  pages: { pageId: string; imageUrl: string }[];
  audioByVoice: Record<string, ManifestAudio[]>;
  voices: VoicePresetDef[];
}

const POOL_SIZE = 3;

function storyDir(storyId: string): string {
  const root = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '';
  return `${root}lumi/stories/${storyId}`;
}

export function localAudioPath(
  storyId: string,
  pageId: string,
  voiceId: string,
  ext: string,
): string {
  return `${storyDir(storyId)}/audio/${voiceId}/${pageId}.${ext}`;
}

export function localTimingsPath(storyId: string, pageId: string, voiceId: string): string {
  return `${storyDir(storyId)}/audio/${voiceId}/${pageId}.json`;
}

/** Encontra o arquivo local pra (voiceId, pageId) testando mp3/wav. null se não houver. */
export async function findLocalAudio(
  storyId: string,
  pageId: string,
  voiceId: string,
): Promise<{ uri: string; ext: 'mp3' | 'wav' } | null> {
  for (const ext of ['mp3', 'wav'] as const) {
    const uri = localAudioPath(storyId, pageId, voiceId, ext);
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && (info.size ?? 0) > 0) return { uri, ext };
  }
  return null;
}

export interface LocalTimings {
  ext: string;
  wordTimings: WordTiming[];
  durationMs: number;
}

/** Lê o sidecar JSON com timings. null se não houver. */
export async function readLocalTimings(
  storyId: string,
  pageId: string,
  voiceId: string,
): Promise<LocalTimings | null> {
  try {
    const path = localTimingsPath(storyId, pageId, voiceId);
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as LocalTimings;
  } catch {
    return null;
  }
}

async function ensureDir(uri: string): Promise<void> {
  const dir = uri.slice(0, uri.lastIndexOf('/'));
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
}

async function downloadOne(url: string, target: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(target);
  if (info.exists && (info.size ?? 0) > 0) return false; // já está
  await ensureDir(target);
  await FileSystem.downloadAsync(url, target);
  return true;
}

async function runPool<T>(items: T[], size: number, work: (item: T) => Promise<void>): Promise<void> {
  let idx = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      try {
        await work(items[i]);
      } catch (err) {
        console.warn('[prefetch] erro:', err instanceof Error ? err.message : err);
      }
    }
  });
  await Promise.all(workers);
}

export interface PrefetchResult {
  downloaded: number;
  skipped: number;
}

/**
 * Baixa todas as narrações pré-bakeadas da história. Roda em background — chame
 * sem `await` se não precisar esperar.
 */
export async function prefetchStoryAudios(storyId: string): Promise<PrefetchResult> {
  let manifest: StoryManifest;
  try {
    manifest = await apiFetch<StoryManifest>(`/stories/${storyId}/manifest`);
  } catch (err) {
    console.warn('[prefetch] manifest indisponível:', err instanceof Error ? err.message : err);
    return { downloaded: 0, skipped: 0 };
  }

  const jobs: { url: string; target: string }[] = [];
  for (const [voiceId, items] of Object.entries(manifest.audioByVoice)) {
    for (const item of items) {
      jobs.push({ url: item.audioUrl, target: localAudioPath(storyId, item.pageId, voiceId, item.ext) });
      jobs.push({ url: item.timingsUrl, target: localTimingsPath(storyId, item.pageId, voiceId) });
    }
  }

  let downloaded = 0;
  let skipped = 0;
  await runPool(jobs, POOL_SIZE, async ({ url, target }) => {
    const did = await downloadOne(url, target);
    if (did) downloaded++;
    else skipped++;
  });
  return { downloaded, skipped };
}
