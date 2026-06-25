// Registra os handlers do outbox (efeito colateral do import) e dispara o flush
// sempre que a conectividade volta a ficar online. Componente sem UI.
import '@/features/community/services/sync-handlers';
import { useEffect } from 'react';

import { useConnectivity } from '@/lib/net/connectivity';
import { useSync } from '@/lib/services/sync';

export function SyncManager() {
  const isOnline = useConnectivity((s) => s.isOnline);
  const flush = useSync((s) => s.flush);

  useEffect(() => {
    if (isOnline) void flush();
  }, [isOnline, flush]);

  return null;
}
