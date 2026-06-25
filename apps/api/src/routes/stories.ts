import { Hono } from 'hono';
import { z } from 'zod';
import { ageBandSchema, createStoryRequestSchema, listStoriesQuerySchema, storyToneSchema } from '@lumi/shared';

import { prisma } from '@/db';
import { requireAuth, type AuthEnv } from '@/middleware/auth';
import { aiProvider } from '@/ai';
import { imageProvider } from '@/image';
import { moderateText } from '@/safety/moderation';

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
  return c.json({
    title: story.title,
    ageBand: parsed.data.ageBand,
    tone: parsed.data.tone,
    coverColors: art.coverColors,
    pages: story.pages.map((p, i) => ({ text: p.text, imageUri: art.pageImages[i] })),
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
  return c.json(toStoryDto(story), 201);
});
