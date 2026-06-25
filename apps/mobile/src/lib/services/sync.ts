import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import { uid } from '@/lib/id';
import { isOnline } from '@/lib/net/connectivity';
import type { OutboxItem, OutboxType } from '@/lib/story/types';

/**
 * Outbox de sincronização (offline-first). Mutações que precisam de rede são
 * enfileiradas e despachadas no `flush()` quando online. Hoje o "envio" é um
 * stub que apenas marca como concluído (mock); trocar por chamadas reais depois.
 */
interface SyncState {
  outbox: OutboxItem[];
  enqueue: (type: OutboxType, payload: unknown) => string;
  flush: () => Promise<void>;
  pendingCount: () => number;
}

export const useSync = create<SyncState>()(
  persist(
    (set, get) => ({
      outbox: [],
      enqueue: (type, payload) => {
        const item: OutboxItem = {
          id: uid('ob_'),
          type,
          payload,
          status: 'queued',
          createdAt: Date.now(),
        };
        set((s) => ({ outbox: [...s.outbox, item] }));
        // tentativa otimista de flush
        void get().flush();
        return item.id;
      },
      flush: async () => {
        if (!isOnline()) return;
        const queued = get().outbox.filter((i) => i.status === 'queued');
        if (queued.length === 0) return;
        // mock: marca como enviando, depois concluído e remove
        set((s) => ({
          outbox: s.outbox.map((i) =>
            i.status === 'queued' ? { ...i, status: 'syncing' as const } : i,
          ),
        }));
        // (aqui entrariam as chamadas reais ao backend por tipo)
        set((s) => ({ outbox: s.outbox.filter((i) => i.status !== 'syncing') }));
      },
      pendingCount: () => get().outbox.filter((i) => i.status !== 'done').length,
    }),
    { name: 'lumi-outbox', storage: zustandStorage },
  ),
);
