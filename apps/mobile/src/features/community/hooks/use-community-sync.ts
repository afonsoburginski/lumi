import { useEffect } from 'react';

import {
  useRemoteStories,
  type ListStoriesParams,
} from '@/features/community/services/story-repository';
import { useCommunity } from '@/features/community/store/community-store';

/**
 * Hidrata o feed da comunidade com dados do servidor quando há backend e está
 * online (via TanStack Query). Sem backend, o hook fica inativo e o seed local
 * (offline-first) responde sozinho.
 */
export function useCommunitySync(params: ListStoriesParams = {}) {
  const { data } = useRemoteStories(params);
  const mergeRemote = useCommunity((s) => s.mergeRemote);

  useEffect(() => {
    if (data && data.length > 0) mergeRemote(data);
  }, [data, mergeRemote]);
}
