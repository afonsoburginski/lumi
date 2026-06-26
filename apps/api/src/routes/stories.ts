import { Hono } from 'hono';
import { z } from 'zod';
import { ageBandSchema, createStoryRequestSchema, listStoriesQuerySchema, storyToneSchema } from '@lumi/shared';

import { prisma } from '@/db';
import { requireAuth, type AuthEnv } from '@/middleware/auth';
import { aiProvider } from '@/ai';
import { imageProvider } from '@/image';
import { moderateText } from '@/safety/moderation';
import {
  storageEnabled,
  putAsset,
  sha256,
  storyAudioMetaKey,
  listKeys,
  publicUrl,
} from '@/storage';
import { ACTIVE_VOICE_PRESETS } from '@lumi/shared';
import { prebakeStory, prebakeStoryInBackground } from '@/voice/prebake';

/**
 * Sobe uma imagem data-URI (data:image/png;base64,...) pro R2 e devolve a URL
 * pública. Usada na FASE DE GERAÇÃO (antes da história ter id) — joga num bucket
 * temporário `previews/` com hash do conteúdo; quando a história é publicada,
 * a imagem é re-uploada pro path semântico definitivo.
 *
 * Passa direto se já for URL ou storage off.
 */
async function persistImage(src: string): Promise<string> {
  if (!storageEnabled || !src.startsWith('data:')) return src;
  const m = src.match(/^data:(image\/(\w+));base64,(.+)$/);
  if (!m) return src;
  const [, mime, ext, b64] = m;
  const bytes = Buffer.from(b64, 'base64');
  // pré-publicação: chave content-addressed em `previews/` (sem storyId ainda).
  const key = `previews/${sha256(bytes)}.${ext}`;
  const { url } = await putAsset(key, bytes, mime);
  return url;
}

export const storyRoutes = new Hono<AuthEnv>();

const storyInclude = { pages: { orderBy: { index: 'asc' } }, author: true } as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toStoryDto(s: any) {
  return {
    id: s.id,
    title: s.title,
    authorId: s.authorId,
    authorName: s.author?.name,
    ageBand: s.ageBand,
    tone: s.tone ?? undefined,
    coverColors: s.coverColors ?? undefined,
    coverUri: s.coverUri ?? undefined,
    moderation: s.moderation,
    isPublic: s.isPublic,
    likes: s.likes,
    createdAt: s.createdAt.getTime(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pages: s.pages.map((p: any) => ({
      id: p.id,
      imageUri: p.imageUri,
      text: p.text,
      audioUri: p.audioUri ?? undefined,
      wordTimings: p.wordTimings ?? undefined,
    })),
  };
}

// Publicação: o cliente gera a história (offline-first) e a envia para persistir.
const publishStorySchema = z.object({
  title: z.string().min(1),
  ageBand: ageBandSchema,
  tone: storyToneSchema.optional(),
  coverColors: z.tuple([z.string(), z.string()]).optional(),
  coverUri: z.string().url().optional(),
  isPublic: z.boolean().default(true),
  pages: z
    .array(
      z.object({
        imageUri: z.string(),
        text: z.string().min(1),
        audioUri: z.string().optional(),
        wordTimings: z
          .array(z.object({ word: z.string(), startMs: z.number(), endMs: z.number() }))
          .optional(),
      }),
    )
    .min(1),
});

// Geração de história via IA (Claude), com safety na ENTRADA e na SAÍDA.
// Retorna o rascunho (não persiste); o cliente faz preview e publica via POST /stories.
storyRoutes.post('/generate', requireAuth, async (c) => {
  const parsed = createStoryRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'validation', message: 'Pedido de geração inválido' }, 400);
  }
  // 1) Safety — entrada
  const inMod = moderateText(parsed.data.prompt);
  if (inMod.status === 'rejected') {
    return c.json({ error: 'blocked', message: inMod.reason, categories: inMod.categories }, 422);
  }
  // 2) Geração
  const story = await aiProvider.generateStory({
    prompt: parsed.data.prompt,
    ageBand: parsed.data.ageBand,
    tone: parsed.data.tone,
  });
  // 3) Safety — saída (cada página)
  const blocked = story.pages.map((p) => moderateText(p.text)).find((r) => r.status === 'rejected');
  if (blocked) {
    return c.json({ error: 'blocked', message: blocked.reason, categories: blocked.categories }, 422);
  }
  // 4) Ilustração (capa + imagens por página)
  const art = await imageProvider.illustrate({
    title: story.title,
    tone: parsed.data.tone,
    pageTexts: story.pages.map((p) => p.text),
  });
  // Persiste as imagens no R2 (quando habilitado) → DB guarda URL, não base64.
  const pageImages = await Promise.all(art.pageImages.map((img) => persistImage(img)));
  return c.json({
    title: story.title,
    ageBand: parsed.data.ageBand,
    tone: parsed.data.tone,
    coverColors: art.coverColors,
    pages: story.pages.map((p, i) => ({ text: p.text, imageUri: pageImages[i] })),
    provider: aiProvider.name,
  });
});

storyRoutes.get('/', async (c) => {
  const parsed = listStoriesQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: 'validation', message: 'Query inválida' }, 400);
  const { q, ageBand, limit } = parsed.data;
  const stories = await prisma.story.findMany({
    where: {
      isPublic: true,
      moderation: 'approved',
      ...(ageBand ? { ageBand } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    },
    include: storyInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return c.json({ stories: stories.map(toStoryDto) });
});

storyRoutes.get('/:id', async (c) => {
  const story = await prisma.story.findUnique({
    where: { id: c.req.param('id') },
    include: storyInclude,
  });
  if (!story || !story.isPublic) {
    return c.json({ error: 'not_found', message: 'História não encontrada' }, 404);
  }
  return c.json(toStoryDto(story));
});

/**
 * Manifest p/ download offline. Estrutura agrupada por entidade:
 *
 *   { cover, pages[{ pageId, imageUrl }], audioByVoice: { [voiceId]: [{ pageId, audioUrl, timingsUrl, ext }] }, voices }
 *
 * `audioByVoice` reflete o estado real do R2: só inclui o que o pré-bake já
 * empurrou. O cliente compara com o catálogo `voices` e, se faltar voz/página,
 * pede a síntese sob demanda via `POST /voice/synthesize` (passando storyId/pageId
 * pra cair na key correta).
 */
storyRoutes.get('/:id/manifest', async (c) => {
  const storyId = c.req.param('id');
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: storyInclude,
  });

  const audioByVoice: Record<string, { pageId: string; audioUrl: string; timingsUrl: string; ext: string }[]> = {};

  if (storageEnabled) {
    // Lista o que JÁ ESTÁ no R2 dentro de stories/<id>/audio/.
    // Keys têm o shape: stories/<id>/audio/<voiceId>/<pageId>.(mp3|wav|json)
    const prefix = `stories/${storyId}/audio/`;
    const keys = await listKeys(prefix);
    for (const key of keys) {
      const rest = key.slice(prefix.length); // <voiceId>/<pageId>.<ext>
      const m = rest.match(/^([^/]+)\/(.+)\.(mp3|wav)$/);
      if (!m) continue; // pula .json e qualquer outra coisa
      const [, voiceId, pageId, ext] = m;
      if (!audioByVoice[voiceId]) audioByVoice[voiceId] = [];
      audioByVoice[voiceId].push({
        pageId,
        audioUrl: publicUrl(key),
        timingsUrl: publicUrl(storyAudioMetaKey(storyId, pageId, voiceId)),
        ext,
      });
    }
  }

  // Hidrata cover/pages SE houver registro no DB; histórias-seed (bundled no
  // mobile) não têm registro e ainda assim devem expor `audioByVoice` do R2 pra
  // o mobile baixar as outras vozes pré-bakeadas.
  const hasDbStory = !!story && story.isPublic;
  const hasR2Audio = Object.keys(audioByVoice).length > 0;
  if (!hasDbStory && !hasR2Audio) {
    return c.json({ error: 'not_found', message: 'História não encontrada' }, 404);
  }

  return c.json({
    storyId,
    version: story?.createdAt.getTime() ?? 0,
    cover: story?.coverUri ? { url: story.coverUri } : null,
    pages: story?.pages.map((p) => ({ pageId: p.id, imageUrl: p.imageUri })) ?? [],
    audioByVoice,
    voices: ACTIVE_VOICE_PRESETS,
  });
});

// Deleta uma história do próprio usuário (cascade: pages, comments, ratings).
storyRoutes.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const story = await prisma.story.findUnique({ where: { id }, select: { authorId: true } });
  if (!story) {
    return c.json({ error: 'not_found', message: 'História não encontrada' }, 404);
  }
  if (story.authorId !== c.get('userId')) {
    return c.json({ error: 'forbidden', message: 'Você não é o autor desta história' }, 403);
  }
  await prisma.story.delete({ where: { id } });
  return c.json({ ok: true });
});

storyRoutes.post('/', requireAuth, async (c) => {
  const parsed = publishStorySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: 'validation', message: 'História inválida', details: parsed.error.flatten() }, 400);
  }
  const { pages, ...data } = parsed.data;
  const story = await prisma.story.create({
    data: {
      title: data.title,
      ageBand: data.ageBand,
      tone: data.tone,
      coverColors: data.coverColors,
      coverUri: data.coverUri,
      isPublic: data.isPublic,
      moderation: 'approved', // já moderada no cliente; servidor reavaliaria aqui
      authorId: c.get('userId'),
      pages: {
        create: pages.map((p, index) => ({
          index,
          imageUri: p.imageUri,
          text: p.text,
          audioUri: p.audioUri,
          wordTimings: p.wordTimings,
        })),
      },
    },
    include: storyInclude,
  });
  // Background: pré-bake das narrações em todas as vozes (não bloqueia a resposta).
  prebakeStoryInBackground(story.id);
  return c.json(toStoryDto(story), 201);
});

/**
 * Pré-bake manual: dispara síntese em TODAS as vozes ativas pra todas as páginas
 * e empurra pro R2 (organizado em `stories/<id>/audio/<voiceId>/<pageId>.<ext>`).
 * Idempotente — só sintetiza o que ainda não existe no bucket.
 */
storyRoutes.post('/:id/prebake-voices', async (c) => {
  const report = await prebakeStory(c.req.param('id'));
  return c.json(report);
});
