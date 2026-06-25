import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/lib/store/authStore';
import { useQuota } from '@/lib/store/quotaStore';

export type GateAction =
  | 'read'
  | 'create'
  | 'like'
  | 'comment'
  | 'rate'
  | 'favorite'
  | 'collection'
  | 'clone_voice';

/** Ações que exigem login (qualquer ação além de ler). */
const REQUIRES_LOGIN: GateAction[] = [
  'create',
  'like',
  'comment',
  'rate',
  'favorite',
  'collection',
  'clone_voice',
];

/**
 * Gating central Visitante × Logado (ver docs/mods/auth/features/guest-gating.md).
 * Decide entre: executar `onAllowed`, abrir AuthPrompt (login) ou Paywall (limite diário).
 */
export function useGate() {
  const router = useRouter();
  const isLoggedIn = useAuth((s) => s.user !== null);
  const canRead = useQuota((s) => s.canRead);
  const recordRead = useQuota((s) => s.recordRead);

  const gate = useCallback(
    (action: GateAction, onAllowed: () => void) => {
      if (action === 'read') {
        if (isLoggedIn) return onAllowed();
        if (canRead()) {
          recordRead();
          return onAllowed();
        }
        return router.push('/paywall');
      }
      if (REQUIRES_LOGIN.includes(action) && !isLoggedIn) {
        return router.push({ pathname: '/auth-prompt', params: { action } });
      }
      return onAllowed();
    },
    [isLoggedIn, canRead, recordRead, router],
  );

  return { gate, isLoggedIn };
}
