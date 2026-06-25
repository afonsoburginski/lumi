import { Hono } from 'hono';
import { z } from 'zod';

import { requireAuth, type AuthEnv } from '@/middleware/auth';
import { voiceProvider } from '@/voice';

export const voiceRoutes = new Hono<AuthEnv>();

voiceRoutes.get('/presets', (c) => c.json({ presets: voiceProvider.listPresets() }));

const synthSchema = z.object({
  text: z.string().min(1).max(2000),
  voiceId: z.string().default('preset-fada'),
});

// Sintetiza a narração de um texto → áudio (quando há provider) + wordTimings (karaokê).
voiceRoutes.post('/synthesize', async (c) => {
  const parsed = synthSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'validation', message: 'Texto inválido' }, 400);
  const narration = await voiceProvider.synthesize(parsed.data.text, parsed.data.voiceId);
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
