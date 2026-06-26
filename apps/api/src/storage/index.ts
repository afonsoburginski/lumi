import { S3Client } from 'bun';

import { env } from '@/env';

/**
 * Storage de assets (imagens + áudio + avatares) em object storage S3-compatible
 * (Cloudflare R2).
 *
 * Paths SEMÂNTICOS agrupados por entidade — facilita auditoria/limpeza do bucket
 * e dá uma "pasta por história":
 *
 *     stories/<storyId>/cover.<ext>
 *     stories/<storyId>/pages/<pageId>.<ext>
 *     stories/<storyId>/audio/<voiceId>/<pageId>.<ext>
 *     stories/<storyId>/audio/<voiceId>/<pageId>.json   (timings + duração)
 *     avatars/<userId>.<ext>
 *     previews/<sha>.<ext>                              (TTS ad-hoc sem dono)
 *
 * Sem chaves configuradas, `storageEnabled` é false e os callers caem em base64
 * inline — nada quebra até as chaves entrarem.
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

// ---- Key builders (paths semânticos) ---------------------------------------

const STORY_PREFIX = 'stories';
const AVATAR_PREFIX = 'avatars';
const PREVIEW_PREFIX = 'previews';

/** Capa da história. */
export function storyCoverKey(storyId: string, ext = 'png'): string {
  return `${STORY_PREFIX}/${storyId}/cover.${ext}`;
}

/** Imagem de uma página. */
export function storyImageKey(storyId: string, pageId: string, ext = 'png'): string {
  return `${STORY_PREFIX}/${storyId}/pages/${pageId}.${ext}`;
}

/** Narração de uma página numa voz específica. */
export function storyAudioKey(
  storyId: string,
  pageId: string,
  voiceId: string,
  ext: string,
): string {
  return `${STORY_PREFIX}/${storyId}/audio/${voiceId}/${pageId}.${ext}`;
}

/** Sidecar JSON com wordTimings + durationMs ao lado do áudio. */
export function storyAudioMetaKey(storyId: string, pageId: string, voiceId: string): string {
  return `${STORY_PREFIX}/${storyId}/audio/${voiceId}/${pageId}.json`;
}

/** Avatar de perfil. */
export function avatarKey(userId: string, ext = 'png'): string {
  return `${AVATAR_PREFIX}/${userId}.${ext}`;
}

/** Path para áudio ad-hoc sem dono (preview de voz, etc.). */
export function previewAudioKey(voiceId: string, text: string, ext: string): string {
  const norm = text.trim().replace(/\s+/g, ' ');
  const hash = new Bun.CryptoHasher('sha256').update(`${voiceId}\n${norm}`).digest('hex');
  return `${PREVIEW_PREFIX}/${hash}.${ext}`;
}

/** Sidecar JSON ao lado de um preview de áudio. */
export function previewAudioMetaKey(voiceId: string, text: string): string {
  const norm = text.trim().replace(/\s+/g, ' ');
  const hash = new Bun.CryptoHasher('sha256').update(`${voiceId}\n${norm}`).digest('hex');
  return `${PREVIEW_PREFIX}/${hash}.json`;
}

// ---- I/O --------------------------------------------------------------------

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

/**
 * Lista TODAS as keys com um dado prefix (pagina automaticamente). Usado por
 * cleanup, manifest e migrações. Retorna [] se storage off.
 */
export async function listKeys(prefix: string): Promise<string[]> {
  if (!client) return [];
  const out: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.list({ prefix, continuationToken: token, maxKeys: 1000 });
    for (const item of res.contents ?? []) out.push(item.key);
    token = res.isTruncated ? res.continuationToken : undefined;
  } while (token);
  return out;
}

/** Deleta uma key. No-op se storage off. */
export async function deleteKey(key: string): Promise<void> {
  if (!client) return;
  try {
    await client.delete(key);
  } catch {
    /* ignore */
  }
}
