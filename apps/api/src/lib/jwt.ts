import { sign, verify } from 'hono/jwt';

import { env } from '@/env';

type TokenType = 'access' | 'refresh';

interface Payload {
  sub: string;
  type: TokenType;
  exp: number;
  [key: string]: unknown;
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export async function signAccessToken(userId: string): Promise<string> {
  const payload: Payload = { sub: userId, type: 'access', exp: nowSec() + env.jwt.accessTtlSec };
  return sign(payload, env.jwt.accessSecret);
}

export async function signRefreshToken(userId: string): Promise<string> {
  const payload: Payload = { sub: userId, type: 'refresh', exp: nowSec() + env.jwt.refreshTtlSec };
  return sign(payload, env.jwt.refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<Payload> {
  return (await verify(token, env.jwt.accessSecret, 'HS256')) as unknown as Payload;
}

export async function verifyRefreshToken(token: string): Promise<Payload> {
  return (await verify(token, env.jwt.refreshSecret, 'HS256')) as unknown as Payload;
}

/** Hash determinístico (sha256) para guardar o refresh token no banco. */
export function hashToken(token: string): string {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(token);
  return hasher.digest('hex');
}
