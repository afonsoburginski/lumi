import { Hono } from 'hono';

import { env } from '@/env';
import { listKeys, deleteKey, storageEnabled } from '@/storage';

/**
 * Endpoints administrativos one-shot (cleanup, migrações).
 *
 * Gated por env: o middleware retorna 404 a menos que `ALLOW_ADMIN_OPS=1` esteja
 * setado no compose. Após rodar a operação, desliga a flag pra fechar a porta.
 *
 * NÃO inclui autenticação porque é uma operação pontual sob controle do operador.
 */
export const adminRoutes = new Hono();

adminRoutes.use('*', async (c, next) => {
  if (!env.admin.enabled) return c.json({ error: 'not_found' }, 404);
  await next();
});

const LEGACY_PREFIXES = ['images/', 'audio/', 'test/'] as const;

/**
 * Remove paths legados do R2 (`images/`, `audio/`, `test/`) — sobreviventes do
 * layout content-addressed antigo + experimentos manuais. Os paths atuais
 * (`stories/`, `avatars/`, `previews/`) ficam intactos.
 *
 *   POST /admin/cleanup-r2-legacy            # dry-run
 *   POST /admin/cleanup-r2-legacy?confirm=1  # apaga de verdade
 */
adminRoutes.post('/cleanup-r2-legacy', async (c) => {
  if (!storageEnabled) {
    return c.json({ error: 'storage_disabled', message: 'R2 storage não habilitado' }, 400);
  }
  const confirm = c.req.query('confirm') === '1';
  const summary: { prefix: string; matched: number; deleted: number; sample: string[] }[] = [];

  for (const prefix of LEGACY_PREFIXES) {
    const keys = await listKeys(prefix);
    let deleted = 0;
    if (confirm) {
      for (const key of keys) {
        await deleteKey(key);
        deleted++;
      }
    }
    summary.push({ prefix, matched: keys.length, deleted, sample: keys.slice(0, 10) });
  }

  return c.json({ dryRun: !confirm, summary });
});
