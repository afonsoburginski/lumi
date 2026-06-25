import { Hono } from 'hono';
import {
  ageBandFromAge,
  loginRequestSchema,
  refreshRequestSchema,
  signupRequestSchema,
  type AuthResponse,
  type UserDto,
} from '@lumi/shared';

import { env } from '@/env';
import { prisma } from '@/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/lib/jwt';
import { requireAuth, type AuthEnv } from '@/middleware/auth';

export const authRoutes = new Hono<AuthEnv>();

type DbUser = {
  id: string;
  name: string;
  email: string;
  childAge: number;
  ageBand: string;
};

function toUserDto(u: DbUser): UserDto {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    childAge: u.childAge,
    ageBand: u.ageBand as UserDto['ageBand'],
  };
}

async function issueTokens(userId: string) {
  const accessToken = await signAccessToken(userId);
  const refreshToken = await signRefreshToken(userId);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.jwt.refreshTtlSec * 1000),
    },
  });
  return { accessToken, refreshToken };
}

authRoutes.post('/signup', async (c) => {
  const parsed = signupRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'validation', message: 'Dados inválidos', details: parsed.error.flatten() }, 400);
  }
  const { name, email, password, childAge } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) {
    return c.json({ error: 'conflict', message: 'E-mail já cadastrado' }, 409);
  }
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      childAge,
      ageBand: ageBandFromAge(childAge),
    },
  });
  const tokens = await issueTokens(user.id);
  return c.json({ ...tokens, user: toUserDto(user) } satisfies AuthResponse, 201);
});

authRoutes.post('/login', async (c) => {
  const parsed = loginRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'validation', message: 'Dados inválidos' }, 400);
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return c.json({ error: 'unauthorized', message: 'E-mail ou senha inválidos' }, 401);
  }
  const tokens = await issueTokens(user.id);
  return c.json({ ...tokens, user: toUserDto(user) } satisfies AuthResponse);
});

authRoutes.post('/refresh', async (c) => {
  const parsed = refreshRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'validation', message: 'refreshToken ausente' }, 400);
  }
  let userId: string;
  try {
    const payload = await verifyRefreshToken(parsed.data.refreshToken);
    if (payload.type !== 'refresh') throw new Error('tipo inválido');
    userId = payload.sub;
  } catch {
    return c.json({ error: 'unauthorized', message: 'Refresh token inválido' }, 401);
  }
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.refreshToken) },
  });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    return c.json({ error: 'unauthorized', message: 'Sessão expirada' }, 401);
  }
  // rotação: revoga o atual e emite novos
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return c.json({ error: 'unauthorized', message: 'Usuário não encontrado' }, 401);
  const tokens = await issueTokens(user.id);
  return c.json({ ...tokens, user: toUserDto(user) } satisfies AuthResponse);
});

authRoutes.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return c.json({ error: 'not_found', message: 'Usuário não encontrado' }, 404);
  return c.json(toUserDto(user));
});
