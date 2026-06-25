import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import { uid } from '@/lib/id';
import { ageBandFromAge } from '@/lib/age';
import { config } from '@/config';
import { setAccessToken } from '@/lib/api/client';
import { loginRemote, signupRemote } from '@/features/auth/services/auth-repository';
import type { AgeBand } from '@/theme/tokens';
import type { User } from '@/types/domain';

export type AuthResult = { ok: true } | { ok: false; reason: string };

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** faixa etária ativa (do usuário logado ou padrão para visitante) */
  ageBand: AgeBand;
  isLoggedIn: () => boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string, childAge: number) => Promise<AuthResult>;
  logout: () => void;
  setAgeBand: (b: AgeBand) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      ageBand: '3-5',
      isLoggedIn: () => get().user !== null,

      login: async (email, password) => {
        // Modo mock/offline (sem backend): sessão local otimista.
        if (config.useMocks) {
          const user: User = {
            id: uid('u_'),
            name: email.split('@')[0] || 'Família',
            email,
            childAge: 5,
            ageBand: get().ageBand,
          };
          set({ user, ageBand: user.ageBand });
          return { ok: true };
        }
        // Backend real:
        try {
          const res = await loginRemote({ email, password });
          setAccessToken(res.accessToken);
          set({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            ageBand: res.user.ageBand,
          });
          return { ok: true };
        } catch {
          return { ok: false, reason: 'E-mail ou senha inválidos (ou sem conexão).' };
        }
      },

      signup: async (name, email, password, childAge) => {
        const ageBand = ageBandFromAge(childAge);
        if (config.useMocks) {
          const user: User = { id: uid('u_'), name, email, childAge, ageBand };
          set({ user, ageBand });
          return { ok: true };
        }
        try {
          const res = await signupRemote({ name, email, password, childAge });
          setAccessToken(res.accessToken);
          set({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            ageBand: res.user.ageBand,
          });
          return { ok: true };
        } catch {
          return {
            ok: false,
            reason: 'Não foi possível criar a conta (e-mail em uso ou sem conexão).',
          };
        }
      },

      logout: () => {
        setAccessToken(null);
        set({ user: null, accessToken: null, refreshToken: null });
      },
      setAgeBand: (ageBand) => set({ ageBand }),
    }),
    {
      name: 'lumi-auth',
      storage: zustandStorage,
      // Ao reidratar, devolve o token ao cliente HTTP para manter a sessão.
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAccessToken(state.accessToken);
      },
    },
  ),
);
