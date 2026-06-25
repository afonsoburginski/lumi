import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient para estado de servidor (TanStack Query). Defaults pensados para
 * mobile/offline-first: dados ficam "frescos" por um tempo e não refazem fetch à toa.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 60 * 24, // 24h em cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
