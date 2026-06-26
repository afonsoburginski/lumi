import { S3Client } from 'bun';

import { env } from '@/env';

/**
 * Storage de assets (imagens + áudio) em object storage S3-compatible (Cloudflare R2).
 *
 * Chaves são CONTENT-ADDRESSED (sha256) → o mesmo conteúdo nunca é duplicado e o
 * upload é idempotente. O DB guarda só a URL pública (servida pelo domínio/CDN de
 * R2_PUBLIC_BASE_URL). Sem chaves configuradas, `enabled` é false e os callers
 * mantêm o comportamento atual (base64) — nada quebra até as chaves entrarem.
 */

const { bucket, endpoint, publicBaseUrl, accessKeyId, secretAccessKey } = env.storage;

export const storageEnabled = Boolean(bucket && endpoint && accessKeyId && secretAccessKey);

const client = storageEnabled
  ? new S3Client({ accessKeyId, secretAccessKey, bucket, endpoint, region: 'auto' })
  : null;

/** URL pública (CDN) de uma key. */
export function publicUrl(key: string): string {
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/${key}`;
}

/** sha256 hex de um buffer. */
export function sha256(data: Uint8Array | Buffer): string {
  return new Bun.CryptoHasher('sha256').update(data).digest('hex');
}

/** Key content-addressed de uma imagem (dedupe por bytes). */
export function imageKey(data: Uint8Array | Buffer, ext = 'png'): string {
  return `images/${sha256(data)}.${ext}`;
}

/**
 * Hash content-addressed de uma narração (dedupe por voz + texto normalizado).
 * Sem extensão: o áudio vira `<base>.<ext>` e os metadados (timings) `<base>.json`,
 * permitindo formatos diferentes por vendor (mp3 ElevenLabs / wav Gemini).
 */
export function audioHashKey(voiceId: string, text: string): string {
  const norm = text.trim().replace(/\s+/g, ' ');
  const hash = new Bun.CryptoHasher('sha256').update(`${voiceId}\n${norm}`).digest('hex');
  return `audio/${hash}`;
}

/** Existe a key no bucket? false se storage off. */
export async function exists(key: string): Promise<boolean> {
  if (!client) return false;
  try {
    return await client.file(key).exists();
  } catch {
    return false;
  }
}

/** Lê uma key como texto (ex.: sidecar JSON). null se não existir / storage off. */
export async function getText(key: string): Promise<string | null> {
  if (!client) return null;
  try {
    const f = client.file(key);
    if (!(await f.exists())) return null;
    return await f.text();
  } catch {
    return null;
  }
}

/**
 * Sobe um asset (idempotente: se a key já existe, não re-envia). Retorna a URL
 * pública. Lança se o storage não estiver habilitado — o caller decide o fallback.
 */
export async function putAsset(
  key: string,
  data: Uint8Array | Buffer,
  contentType: string,
): Promise<{ key: string; url: string }> {
  if (!client) throw new Error('storage desabilitado (faltam chaves R2)');
  const file = client.file(key);
  if (!(await file.exists())) {
    await client.write(key, data, { type: contentType });
  }
  return { key, url: publicUrl(key) };
}
