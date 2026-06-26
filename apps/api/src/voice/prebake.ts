import { ACTIVE_VOICE_PRESETS } from '@lumi/shared';

import { prisma } from '@/db';
import { voiceProvider } from '@/voice';
import {
  storageEnabled,
  storyAudioKey,
  storyAudioMetaKey,
  exists,
  putAsset,
} from '@/storage';

/**
 * Pré-bake de narrações de uma história em TODAS as vozes ativas.
 *
 * Idempotente: se a key já existe no R2, pula. Concorrência limitada (`POOL_SIZE`)
 * pra não estourar rate-limit dos provedores. Strict: NÃO usa fallback cross-vendor
 * (se a vendor da voz falhar, o slot fica vazio e tenta de novo numa próxima rodada).
 *
 * Trigger automático: chamado em background ao publicar uma história
 * (`POST /stories`). Trigger manual: `POST /stories/:id/prebake-voices`.
 */
const POOL_SIZE = 3;

interface Job {
  pageId: string;
  voiceId: string;
  text: string;
}

interface JobResult {
  pageId: string;
  voiceId: string;
  status: 'rendered' | 'skipped' | 'failed';
  reason?: string;
}

export interface PrebakeReport {
  storyId: string;
  totalJobs: number;
  rendered: number;
  skipped: number;
  failed: number;
  errors: { pageId: string; voiceId: string; reason: string }[];
}

const extFor = (mime?: string): string => (mime?.includes('wav') ? 'wav' : 'mp3');

async function runJob(storyId: string, job: Job): Promise<JobResult> {
  const { pageId, voiceId, text } = job;
  // já existe (em qualquer extensão suportada)? pula.
  for (const ext of ['mp3', 'wav'] as const) {
    if (await exists(storyAudioKey(storyId, pageId, voiceId, ext))) {
      return { pageId, voiceId, status: 'skipped' };
    }
  }
  try {
    const narration = await voiceProvider.synthesize(text, voiceId);
    if (!narration.audioBase64) {
      return { pageId, voiceId, status: 'failed', reason: 'provider não retornou áudio' };
    }
    const ext = extFor(narration.mimeType);
    const audioKey = storyAudioKey(storyId, pageId, voiceId, ext);
    const metaKey = storyAudioMetaKey(storyId, pageId, voiceId);
    const bytes = Buffer.from(narration.audioBase64, 'base64');
    await putAsset(audioKey, bytes, narration.mimeType ?? 'audio/mpeg');
    await putAsset(
      metaKey,
      Buffer.from(
        JSON.stringify({
          ext,
          wordTimings: narration.wordTimings,
          durationMs: narration.durationMs,
        }),
      ),
      'application/json',
    );
    return { pageId, voiceId, status: 'rendered' };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { pageId, voiceId, status: 'failed', reason };
  }
}

/** Executa um pool de jobs com concorrência limitada. */
async function runPool<T, R>(items: T[], size: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      results[i] = await work(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function prebakeStory(storyId: string): Promise<PrebakeReport> {
  if (!storageEnabled) {
    return {
      storyId,
      totalJobs: 0,
      rendered: 0,
      skipped: 0,
      failed: 0,
      errors: [{ pageId: '-', voiceId: '-', reason: 'storage R2 desabilitado' }],
    };
  }
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { pages: { orderBy: { index: 'asc' } } },
  });
  if (!story) {
    return {
      storyId,
      totalJobs: 0,
      rendered: 0,
      skipped: 0,
      failed: 0,
      errors: [{ pageId: '-', voiceId: '-', reason: 'história não encontrada' }],
    };
  }

  const jobs: Job[] = [];
  for (const page of story.pages) {
    for (const voice of ACTIVE_VOICE_PRESETS) {
      jobs.push({ pageId: page.id, voiceId: voice.id, text: page.text });
    }
  }

  const results = await runPool(jobs, POOL_SIZE, (j) => runJob(storyId, j));

  const report: PrebakeReport = {
    storyId,
    totalJobs: jobs.length,
    rendered: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
  for (const r of results) {
    if (r.status === 'rendered') report.rendered++;
    else if (r.status === 'skipped') report.skipped++;
    else {
      report.failed++;
      report.errors.push({ pageId: r.pageId, voiceId: r.voiceId, reason: r.reason ?? 'erro' });
    }
  }
  return report;
}

/** Dispara prebake em background — sem await; loga ao terminar. */
export function prebakeStoryInBackground(storyId: string): void {
  if (!storageEnabled) return;
  queueMicrotask(() => {
    prebakeStory(storyId)
      .then((r) => {
        console.log(
          `[prebake] story=${r.storyId} rendered=${r.rendered} skipped=${r.skipped} failed=${r.failed}`,
        );
        if (r.failed > 0) console.warn('[prebake] errors:', r.errors.slice(0, 5));
      })
      .catch((err) => console.error(`[prebake] story=${storyId} erro inesperado:`, err));
  });
}
