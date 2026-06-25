import { useCommunity } from '@/lib/store/communityStore';
import { useLibrary } from '@/lib/store/libraryStore';
import type { Story } from '@/lib/story/types';

/** Resolve uma história por id, procurando na comunidade e na biblioteca do usuário. */
export function useStory(id?: string): Story | undefined {
  const fromCommunity = useCommunity((s) => (id ? s.stories.find((x) => x.id === id) : undefined));
  const fromLibrary = useLibrary((s) => (id ? s.myStories.find((x) => x.id === id) : undefined));
  return fromCommunity ?? fromLibrary;
}
