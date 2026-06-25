import { useQuery } from '@tanstack/react-query';

import { config } from '@/config';
import { apiFetch } from '@/lib/api/client';
import type { AgeBand } from '@lumi/shared/types';
import type { Story } from '@/types/domain';

/**
 * Repository de histórias (padrão decidido no ADR): a UI fala com este módulo,
 * não direto com fetch. Hoje, quando há backend (config.apiUrl) busca da API;
 * sem backend, o offline-first via Zustand (community-store) é a fonte da verdade.
 *
 * Estratégia de sync (offline-first): quando online, `useRemoteStories` traz dados
 * frescos via TanStack Query (cache + retry); um efeito de hidratação pode então
 * mesclar no community-store. Offline, a store/seed local responde sozinha.
 */

export interface ListStoriesParams {
  q?: string;
  ageBand?: AgeBand;
  limit?: number;
}

export async function fetchStories(params: ListStoriesParams = {}): Promise<Story[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.ageBand) qs.set('ageBand', params.ageBand);
  if (params.limit) qs.set('limit', String(params.limit));
  const data = await apiFetch<{ stories: Story[] }>(`/stories?${qs.toString()}`);
  return data.stories;
}

/** Hook de leitura do servidor. Desativado quando não há backend (usa mock/offline). */
export function useRemoteStories(params: ListStoriesParams = {}) {
  return useQuery({
    queryKey: ['stories', params],
    queryFn: () => fetchStories(params),
    enabled: !config.useMocks,
  });
}
