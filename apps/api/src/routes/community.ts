import { Hono } from 'hono';
import { z } from 'zod';
import { collectionRequestSchema, commentRequestSchema, rateRequestSchema } from '@lumi/shared';

import { prisma } from '@/db';
import { requireAuth, type AuthEnv } from '@/middleware/auth';

export const communityRoutes = new Hono<AuthEnv>();

// Curtir / descurtir (o cliente mantém seu próprio estado liked offline-first).
communityRoutes.post('/stories/:id/like', requireAuth, async (c) => {
  const parsed = z.object({ liked: z.boolean() }).safeParse(await c.req.json().catch(() => null));
  const liked = parsed.success ? parsed.data.liked : true;
  const story = await prisma.story.update({
    where: { id: c.req.param('id') },
    data: { likes: { increment: liked ? 1 : -1 } },
  });
  return c.json({ likes: Math.max(0, story.likes) });
});

communityRoutes.get('/stories/:id/comments', async (c) => {
  const comments = await prisma.comment.findMany({
    where: { storyId: c.req.param('id'), moderation: 'approved' },
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });
  return c.json({
    comments: comments.map((cm) => ({
      id: cm.id,
      storyId: cm.storyId,
      authorId: cm.authorId,
      authorName: cm.author.name,
      text: cm.text,
      createdAt: cm.createdAt.getTime(),
      moderation: cm.moderation,
    })),
  });
});

communityRoutes.post('/stories/:id/comments', requireAuth, async (c) => {
  const parsed = commentRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'validation', message: 'Comentário inválido' }, 400);
  const comment = await prisma.comment.create({
    data: {
      storyId: c.req.param('id'),
      authorId: c.get('userId'),
      text: parsed.data.text,
      moderation: 'approved', // servidor reavaliaria com o classificador aqui
    },
  });
  return c.json({ id: comment.id }, 201);
});

communityRoutes.post('/stories/:id/rate', requireAuth, async (c) => {
  const parsed = rateRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'validation', message: 'Avaliação inválida' }, 400);
  const storyId = c.req.param('id');
  const userId = c.get('userId');
  await prisma.rating.upsert({
    where: { storyId_userId: { storyId, userId } },
    create: { storyId, userId, stars: parsed.data.stars },
    update: { stars: parsed.data.stars },
  });
  const agg = await prisma.rating.aggregate({ where: { storyId }, _avg: { stars: true } });
  return c.json({ average: agg._avg.stars ?? 0 });
});

communityRoutes.get('/collections', requireAuth, async (c) => {
  const collections = await prisma.collection.findMany({
    where: { ownerId: c.get('userId') },
    include: { stories: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return c.json({
    collections: collections.map((col) => ({
      id: col.id,
      ownerId: col.ownerId,
      title: col.title,
      visibility: col.visibility,
      storyIds: col.stories.map((s) => s.id),
      createdAt: col.createdAt.getTime(),
    })),
  });
});

communityRoutes.post('/collections', requireAuth, async (c) => {
  const parsed = collectionRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'validation', message: 'Coleção inválida' }, 400);
  const col = await prisma.collection.create({
    data: {
      ownerId: c.get('userId'),
      title: parsed.data.title,
      visibility: parsed.data.visibility,
    },
  });
  return c.json({ id: col.id }, 201);
});

communityRoutes.post('/collections/:id/stories', requireAuth, async (c) => {
  const parsed = z.object({ storyId: z.string() }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'validation', message: 'storyId ausente' }, 400);
  const col = await prisma.collection.findFirst({
    where: { id: c.req.param('id'), ownerId: c.get('userId') },
  });
  if (!col) return c.json({ error: 'not_found', message: 'Coleção não encontrada' }, 404);
  await prisma.collection.update({
    where: { id: col.id },
    data: { stories: { connect: { id: parsed.data.storyId } } },
  });
  return c.json({ ok: true });
});
