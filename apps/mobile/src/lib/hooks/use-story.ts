import { useCommunity } from '@/features/community/store/community-store';
import { useLibrary } from '@/features/community/store/library-store';
import type { Story } from '@/types/domain';

/** Resolve uma história por id, procurando na comunidade e na biblioteca do usuário. */
export function useStory(id?: string): Story | undefined {
  const fromCommunity = useCommunity((s) => (id ? s.stories.find((x) => x.id === id) : undefined));
  const fromLibrary = useLibrary((s) => (id ? s.myStories.find((x) => x.id === id) : undefined));
  return fromCommunity ?? fromLibrary;
}
