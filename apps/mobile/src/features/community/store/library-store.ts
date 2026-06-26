import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import { uid } from '@/lib/id';
import { useSync } from '@/lib/services/sync';
import { useCommunity } from '@/features/community/store/community-store';
import type { Collection, Story } from '@/types/domain';

/** Biblioteca do usuário: minhas histórias, favoritos e coleções (persistido). */
interface LibraryState {
  myStories: Story[];
  favorites: string[]; // storyIds
  collections: Collection[];

  addStory: (s: Story) => void;
  publishStory: (id: string) => void;
  deleteStory: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  createCollection: (ownerId: string, title: string, visibility?: 'private' | 'public') => string;
  addToCollection: (collectionId: string, storyId: string) => void;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      myStories: [],
      favorites: [],
      collections: [],

      addStory: (s) => set((st) => ({ myStories: [s, ...st.myStories] })),

      publishStory: (id) => {
        set((st) => ({
          myStories: st.myStories.map((s) =>
            s.id === id ? { ...s, isPublic: true, pendingSync: true } : s,
          ),
        }));
        useSync.getState().enqueue('publish_story', { id });
      },

      deleteStory: (id) => {
        const story = get().myStories.find((s) => s.id === id);
        set((st) => ({
          myStories: st.myStories.filter((s) => s.id !== id),
          favorites: st.favorites.filter((f) => f !== id),
          collections: st.collections.map((c) => ({
            ...c,
            storyIds: c.storyIds.filter((sid) => sid !== id),
          })),
        }));
        useCommunity.getState().removeStory(id);
        if (story?.isPublic) {
          useSync.getState().enqueue('delete_story', { id });
        }
      },

      isFavorite: (id) => get().favorites.includes(id),
      toggleFavorite: (id) =>
        set((st) => ({
          favorites: st.favorites.includes(id)
            ? st.favorites.filter((f) => f !== id)
            : [id, ...st.favorites],
        })),

      createCollection: (ownerId, title, visibility = 'private') => {
        const col: Collection = {
          id: uid('col_'),
          ownerId,
          title,
          visibility,
          storyIds: [],
          createdAt: Date.now(),
        };
        set((st) => ({ collections: [col, ...st.collections] }));
        return col.id;
      },

      addToCollection: (collectionId, storyId) =>
        set((st) => ({
          collections: st.collections.map((c) =>
            c.id === collectionId && !c.storyIds.includes(storyId)
              ? { ...c, storyIds: [...c.storyIds, storyId] }
              : c,
          ),
        })),
    }),
    { name: 'lumi-library', storage: zustandStorage },
  ),
);
