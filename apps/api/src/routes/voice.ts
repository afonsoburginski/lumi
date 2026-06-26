import { Hono } from 'hono';
import { z } from 'zod';

import { requireAuth, type AuthEnv } from '@/middleware/auth';
import { voiceProvider } from '@/voice';
import { storageEnabled, audioHashKey, exists, getText, putAsset, publicUrl } from '@/storage';

export const voiceRoutes = new Hono<AuthEnv>();

voiceRoutes.get('/presets', (c) => c.json({ presets: voiceProvider.listPresets() }));

const synthSchema = z.object({
  text: z.string().min(1).max(2000),
  voiceId: z.string().default('preset-fada'),
});

const extFor = (mime?: string) => (mime?.includes('wav') ? 'wav' : 'mp3');

/**
 * Sintetiza a narração de um texto → áudio + wordTimings (karaokê).
 *
 * Com storage (R2): a narração é CONTENT-ADDRESSED por (voz+texto). Se já existe no
 * bucket, devolve a URL sem re-sintetizar (reuso real, zero custo de TTS). Senão,
 * sintetiza, sobe o áudio + um sidecar JSON com os timings, e devolve a URL.
 * Sem storage: cai no comportamento antigo (audioBase64 inline).
 */
voiceRoutes.post('/synthesize', async (c) => {
  const parsed = synthSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'validation', message: 'Texto inválido' }, 400);
  const { text, voiceId } = parsed.data;

  if (storageEnabled) {
    const base = audioHashKey(voiceId, text);
    const metaKey = `${base}.json`;
    const cached = await getText(metaKey);
    if (cached) {
      const meta = JSON.parse(cached) as { ext: string; wordTimings: unknown; durationMs: number };
      return c.json({
        audioUrl: publicUrl(`${base}.${meta.ext}`),
        wordTimings: meta.wordTimings,
        durationMs: meta.durationMs,
      });
    }
    const narration = await voiceProvider.synthesize(text, voiceId);
    if (narration.audioBase64) {
      const ext = extFor(narration.mimeType);
      const bytes = Buffer.from(narration.audioBase64, 'base64');
      await putAsset(`${base}.${ext}`, bytes, narration.mimeType ?? 'audio/mpeg');
      await putAsset(
        metaKey,
        Buffer.from(JSON.stringify({ ext, wordTimings: narration.wordTimings, durationMs: narration.durationMs })),
        'application/json',
      );
      return c.json({
        audioUrl: publicUrl(`${base}.${ext}`),
        wordTimings: narration.wordTimings,
        durationMs: narration.durationMs,
      });
    }
    // provider mock (sem áudio): devolve só os timings
    return c.json({ wordTimings: narration.wordTimings, durationMs: narration.durationMs });
  }

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
