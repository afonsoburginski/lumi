import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import { uid } from '@/lib/id';
import { moderateText } from '@/features/safety/services/moderation';
import { useSync } from '@/lib/services/sync';
import { buildSeedStories } from '@/lib/seed';
import type { AgeBand } from '@/theme/tokens';
import type { Comment, Rating, Story } from '@/types/domain';

/**
 * Feed da comunidade (cache local offline-first). Curtidas/comentários/avaliações
 * são otimistas e entram no outbox para sincronizar quando online.
 * Só conteúdo `approved` é exposto.
 */
interface CommunityState {
  stories: Story[];
  likedByMe: string[];
  comments: Comment[];
  ratings: Rating[];

  addStory: (s: Story) => void;
  /** Remove uma história do feed e limpa likes/comments/ratings locais. */
  removeStory: (id: string) => void;
  /** Hidrata o feed com dados do servidor (upsert por id), preservando locais. */
  mergeRemote: (remote: Story[]) => void;
  getById: (id: string) => Story | undefined;
  approvedStories: () => Story[];
  recommended: (ageBand: AgeBand) => Story[];
  search: (q: string) => Story[];

  toggleLike: (storyId: string) => void;
  addComment: (
    storyId: string,
    authorId: string,
    authorName: string,
    text: string,
  ) => { ok: true } | { ok: false; reason: string };
  commentsFor: (storyId: string) => Comment[];
  rate: (storyId: string, userId: string, stars: number) => void;
  ratingFor: (storyId: string) => number;
}

export const useCommunity = create<CommunityState>()(
  persist(
    (set, get) => ({
      stories: buildSeedStories(),
      likedByMe: [],
      comments: [],
      ratings: [],

      addStory: (s) =>
        set((st) =>
          st.stories.some((x) => x.id === s.id)
            ? { stories: st.stories.map((x) => (x.id === s.id ? s : x)) }
            : { stories: [s, ...st.stories] },
        ),
      removeStory: (id) =>
        set((st) => ({
          stories: st.stories.filter((s) => s.id !== id),
          likedByMe: st.likedByMe.filter((sid) => sid !== id),
          comments: st.comments.filter((c) => c.storyId !== id),
          ratings: st.ratings.filter((r) => r.storyId !== id),
        })),
      mergeRemote: (remote) =>
        set((st) => {
          const byId = new Map(st.stories.map((s) => [s.id, s]));
          for (const r of remote) byId.set(r.id, { ...byId.get(r.id), ...r, downloaded: true });
          return { stories: Array.from(byId.values()) };
        }),
      getById: (id) => get().stories.find((s) => s.id === id),
      approvedStories: () => get().stories.filter((s) => s.moderation === 'approved' && s.isPublic),
      recommended: (ageBand) =>
        get()
          .approvedStories()
          .slice()
          .sort((a, b) => (a.ageBand === ageBand ? -1 : 0) - (b.ageBand === ageBand ? -1 : 0)),
      search: (q) => {
        const query = q.trim().toLowerCase();
        const base = get().approvedStories();
        if (!query) return base;
        return base.filter((s) => s.title.toLowerCase().includes(query));
      },

      toggleLike: (storyId) => {
        const liked = get().likedByMe.includes(storyId);
        set((st) => ({
          likedByMe: liked
            ? st.likedByMe.filter((id) => id !== storyId)
            : [storyId, ...st.likedByMe],
          stories: st.stories.map((s) =>
            s.id === storyId ? { ...s, likes: s.likes + (liked ? -1 : 1) } : s,
          ),
        }));
        useSync.getState().enqueue('like', { storyId, liked: !liked });
      },

      addComment: (storyId, authorId, authorName, text) => {
        const mod = moderateText(text);
        if (mod.status === 'rejected')
          return { ok: false, reason: mod.reason ?? 'Conteúdo bloqueado' };
        const comment: Comment = {
          id: uid('cm_'),
          storyId,
          authorId,
          authorName,
          text,
          createdAt: Date.now(),
          moderation: 'approved',
        };
        set((st) => ({ comments: [comment, ...st.comments] }));
        useSync.getState().enqueue('comment', { storyId, text });
        return { ok: true };
      },
      commentsFor: (storyId) =>
        get()
          .comments.filter((c) => c.storyId === storyId && c.moderation === 'approved')
          .sort((a, b) => b.createdAt - a.createdAt),

      rate: (storyId, userId, stars) => {
        set((st) => ({
          ratings: [
            ...st.ratings.filter((r) => !(r.storyId === storyId && r.userId === userId)),
            { storyId, userId, stars },
          ],
        }));
        useSync.getState().enqueue('rate', { storyId, stars });
      },
      ratingFor: (storyId) => {
        const rs = get().ratings.filter((r) => r.storyId === storyId);
        if (rs.length === 0) return 0;
        return rs.reduce((a, r) => a + r.stars, 0) / rs.length;
      },
    }),
    {
      name: 'lumi-community',
      storage: zustandStorage,
      version: 8,
      // v8: ilustrações limpas (sem blur lateral) preenchendo a página (cover).
      // v7: ilustrações estendidas (spread mais largo 1.44, sem corte).
      // v6: ilustrações recortadas na proporção da página (preenchem sem corte).
      // v5: capa vira página 0 narrada (Catarina show de sonhar). v4: narração offline
      // empacotada na Catarina (show de sonhar). v3: re-semeia
      // com as duas versões da Catarina (jardim + show de sonhar do PDF). v2: troca os
      // seeds mock pela showcase real. Em todos, mantém curtidas/comentários/avaliações.
      migrate: (persisted) => ({
        ...((persisted as object | null) ?? {}),
        stories: buildSeedStories(),
      }),
    },
  ),
);
