import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import { uid } from '@/lib/id';
import { ageBandFromAge } from '@/lib/story/age';
import { useSync } from '@/lib/services/sync';
import type { AgeBand } from '@/theme/tokens';
import type { User } from '@/lib/story/types';

interface AuthState {
  user: User | null;
  /** faixa etária ativa (do usuário logado ou padrão para visitante) */
  ageBand: AgeBand;
  isLoggedIn: () => boolean;
  login: (email: string) => void;
  signup: (name: string, email: string, childAge: number) => void;
  logout: () => void;
  setAgeBand: (b: AgeBand) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      ageBand: '3-5',
      isLoggedIn: () => get().user !== null,

      login: (email) => {
        // offline-first: cria sessão local otimista e enfileira o login real
        const user: User = {
          id: uid('u_'),
          name: email.split('@')[0] || 'Família',
          email,
          childAge: 5,
          ageBand: get().ageBand,
        };
        set({ user, ageBand: user.ageBand });
        useSync.getState().enqueue('login', { email });
      },

      signup: (name, email, childAge) => {
        const ageBand = ageBandFromAge(childAge);
        const user: User = { id: uid('u_'), name, email, childAge, ageBand };
        set({ user, ageBand });
        useSync.getState().enqueue('signup', { name, email, childAge });
      },

      logout: () => set({ user: null }),
      setAgeBand: (ageBand) => set({ ageBand }),
    }),
    { name: 'lumi-auth', storage: zustandStorage },
  ),
);
