import { Hono } from 'hono';
import { z } from 'zod';
import { DEFAULT_VOICE_ID } from '@lumi/shared';

import { requireAuth, type AuthEnv } from '@/middleware/auth';
import { voiceProvider } from '@/voice';
import {
  storageEnabled,
  storyAudioKey,
  storyAudioMetaKey,
  previewAudioKey,
  previewAudioMetaKey,
  getText,
  putAsset,
  publicUrl,
} from '@/storage';

export const voiceRoutes = new Hono<AuthEnv>();

voiceRoutes.get('/presets', (c) => c.json({ presets: voiceProvider.listPresets() }));

const synthSchema = z.object({
  text: z.string().min(1).max(2000),
  voiceId: z.string().default(DEFAULT_VOICE_ID),
  /** Quando informados, a narração é salva em `stories/<id>/audio/<voiceId>/<pageId>`. */
  storyId: z.string().optional(),
  pageId: z.string().optional(),
});

const extFor = (mime?: string) => (mime?.includes('wav') ? 'wav' : 'mp3');

interface AudioMeta {
  ext: string;
  wordTimings: unknown;
  durationMs: number;
}

/** Resolve as keys de áudio + sidecar (history-aware vs preview ad-hoc). */
function resolveKeys(input: {
  text: string;
  voiceId: string;
  storyId?: string;
  pageId?: string;
  ext: string;
}) {
  const { text, voiceId, storyId, pageId, ext } = input;
  if (storyId && pageId) {
    return {
      audioKey: storyAudioKey(storyId, pageId, voiceId, ext),
      metaKey: storyAudioMetaKey(storyId, pageId, voiceId),
    };
  }
  return {
    audioKey: previewAudioKey(voiceId, text, ext),
    metaKey: previewAudioMetaKey(voiceId, text),
  };
}

/**
 * Sintetiza a narração de um texto → áudio + wordTimings (karaokê).
 *
 * Com `storyId + pageId` e storage R2 habilitado: salva em
 *   `stories/<storyId>/audio/<voiceId>/<pageId>.<ext>` + sidecar `.json`.
 * Sem (preview ad-hoc): salva em `previews/<sha>.<ext>`.
 * Reuso real: se a key já existe, devolve a URL sem re-sintetizar.
 * Sem storage configurado: cai no comportamento antigo (audioBase64 inline).
 */
voiceRoutes.post('/synthesize', async (c) => {
  const parsed = synthSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'validation', message: 'Texto inválido' }, 400);
  const { text, voiceId, storyId, pageId } = parsed.data;

  if (storageEnabled) {
    // 1) cache hit pelo sidecar (sabemos a extensão do áudio salvo)
    const probeKeys = ['mp3', 'wav'].map((ext) => resolveKeys({ text, voiceId, storyId, pageId, ext }));
    for (const { audioKey, metaKey } of probeKeys) {
      const cached = await getText(metaKey);
      if (cached) {
        const meta = JSON.parse(cached) as AudioMeta;
        return c.json({
          audioUrl: publicUrl(audioKey),
          timingsUrl: publicUrl(metaKey),
          wordTimings: meta.wordTimings,
          durationMs: meta.durationMs,
        });
      }
    }

    // 2) cache miss → sintetiza e sobe
    const narration = await voiceProvider.synthesize(text, voiceId);
    if (!narration.audioBase64) {
      // provider mock (sem áudio): devolve só os timings
      return c.json({ wordTimings: narration.wordTimings, durationMs: narration.durationMs });
    }
    const ext = extFor(narration.mimeType);
    const { audioKey, metaKey } = resolveKeys({ text, voiceId, storyId, pageId, ext });
    const bytes = Buffer.from(narration.audioBase64, 'base64');
    await putAsset(audioKey, bytes, narration.mimeType ?? 'audio/mpeg');
    const meta: AudioMeta = {
      ext,
      wordTimings: narration.wordTimings,
      durationMs: narration.durationMs,
    };
    await putAsset(metaKey, Buffer.from(JSON.stringify(meta)), 'application/json');
    return c.json({
      audioUrl: publicUrl(audioKey),
      timingsUrl: publicUrl(metaKey),
      wordTimings: narration.wordTimings,
      durationMs: narration.durationMs,
    });
  }

  // Sem storage: comportamento original (base64 inline).
  const narration = await voiceProvider.synthesize(text, voiceId);
  return c.json(narration);
});

const cloneSchema = z.object({
  label: z.string().min(1),
  samplesBase64: z.array(z.string()).default([]),
});

// Clonagem da voz da família (somente logado). Requer consentimento no cliente.
voiceRoutes.post('/clone', requireAuth, async (c) => {
  const parsed = cloneSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'validation', message: 'Dados inválidos' }, 400);
  const result = await voiceProvider.cloneVoice(parsed.data.label, parsed.data.samplesBase64);
  return c.json({ ...result, provider: voiceProvider.name });
});
