import { createMiddleware } from 'hono/factory';

import { verifyAccessToken } from '@/lib/jwt';

export type AuthEnv = { Variables: { userId: string } };

/** Exige um access token JWT válido; injeta `userId` no contexto. */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized', message: 'Token de acesso ausente' }, 401);
  }
  try {
    const payload = await verifyAccessToken(header.slice(7));
    if (payload.type !== 'access') throw new Error('tipo de token inválido');
    c.set('userId', payload.sub);
    await next();
  } catch {
    return c.json({ error: 'unauthorized', message: 'Token de acesso inválido ou expirado' }, 401);
  }
});
