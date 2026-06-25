import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import { todayLocal } from '@/lib/id';

/** Limite diário de leituras do visitante (offline-first, reset 00h local). */
export const GUEST_DAILY_LIMIT = 3;

interface QuotaState {
  date: string;
  count: number;
  remaining: () => number;
  canRead: () => boolean;
  recordRead: () => void;
}

export const useQuota = create<QuotaState>()(
  persist(
    (set, get) => ({
      date: todayLocal(),
      count: 0,
      remaining: () => {
        const today = todayLocal();
        const count = get().date === today ? get().count : 0;
        return Math.max(0, GUEST_DAILY_LIMIT - count);
      },
      canRead: () => get().remaining() > 0,
      recordRead: () => {
        const today = todayLocal();
        if (get().date !== today) set({ date: today, count: 1 });
        else set({ count: get().count + 1 });
      },
    }),
    { name: 'lumi-quota', storage: zustandStorage },
  ),
);
