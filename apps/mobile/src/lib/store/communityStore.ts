import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import { uid } from '@/lib/id';
import { moderateText } from '@/lib/services/moderation';
import { useSync } from '@/lib/services/sync';
import { buildSeedStories } from '@/lib/story/seed';
import type { AgeBand } from '@/theme/tokens';
import type { Comment, Rating, Story } from '@/lib/story/types';

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
  getById: (id: string) => Story | undefined;
  approvedStories: () => Story[];
  recommended: (ageBand: AgeBand) => Story[];
  search: (q: string) => Story[];

  toggleLike: (storyId: string) => void;
  addComment: (storyId: string, authorId: string, authorName: string, text: string) =>
    | { ok: true }
    | { ok: false; reason: string };
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
        if (mod.status === 'rejected') return { ok: false, reason: mod.reason ?? 'Conteúdo bloqueado' };
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
    { name: 'lumi-community', storage: zustandStorage, version: 1 },
  ),
);
