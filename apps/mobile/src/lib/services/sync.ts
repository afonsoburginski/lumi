import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import { uid } from '@/lib/id';
import { isOnline } from '@/lib/net/connectivity';
import type { OutboxItem, OutboxType } from '@/types/domain';

/**
 * Outbox de sincronização (offline-first). Mutações que precisam de rede são
 * enfileiradas e despachadas no `flush()` quando online.
 *
 * Desacoplamento: a `lib` não conhece as features. Cada feature registra um
 * handler por tipo (registerSyncHandler). Itens sem handler são tratados como
 * no-op (removidos) — comportamento de mock quando não há backend.
 */
type SyncHandler = (payload: unknown) => Promise<void>;

const handlers: Partial<Record<OutboxType, SyncHandler>> = {};

export function registerSyncHandler(type: OutboxType, handler: SyncHandler) {
  handlers[type] = handler;
}

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
        void get().flush();
        return item.id;
      },
      flush: async () => {
        if (!isOnline()) return;
        const pending = get().outbox.filter((i) => i.status === 'queued' || i.status === 'failed');
        for (const item of pending) {
          set((s) => ({
            outbox: s.outbox.map((i) => (i.id === item.id ? { ...i, status: 'syncing' } : i)),
          }));
          try {
            const handler = handlers[item.type];
            if (handler) await handler(item.payload);
            // sucesso (ou sem handler → no-op): remove do outbox
            set((s) => ({ outbox: s.outbox.filter((i) => i.id !== item.id) }));
          } catch {
            // mantém para nova tentativa no próximo flush
            set((s) => ({
              outbox: s.outbox.map((i) => (i.id === item.id ? { ...i, status: 'failed' } : i)),
            }));
          }
        }
      },
      pendingCount: () => get().outbox.length,
    }),
    { name: 'lumi-outbox', storage: zustandStorage },
  ),
);
