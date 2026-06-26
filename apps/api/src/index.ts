import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { env } from '@/env';
import { adminRoutes } from '@/routes/admin';
import { authRoutes } from '@/routes/auth';
import { communityRoutes } from '@/routes/community';
import { healthRoutes } from '@/routes/health';
import { storyRoutes } from '@/routes/stories';
import { voiceRoutes } from '@/routes/voice';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.onError((err, c) => {
  console.error('[api error]', err);
  return c.json({ error: 'internal', message: 'Erro interno do servidor' }, 500);
});

app.notFound((c) => c.json({ error: 'not_found', message: 'Rota não encontrada' }, 404));

app.route('/health', healthRoutes);
app.route('/auth', authRoutes);
app.route('/stories', storyRoutes);
app.route('/voice', voiceRoutes);
app.route('/admin', adminRoutes);
app.route('/', communityRoutes); // /stories/:id/(like|comments|rate), /collections

export default { port: env.port, fetch: app.fetch };
