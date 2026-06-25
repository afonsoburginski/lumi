import { create } from 'zustand';

/**
 * Estado de conectividade (offline-first).
 * Por ora `isOnline` é controlado manualmente (toggle no Perfil para demo/testes).
 * Trocar `setOnline` por integração com @react-native-community/netinfo no futuro,
 * mantendo a mesma interface.
 */
interface ConnectivityState {
  isOnline: boolean;
  setOnline: (v: boolean) => void;
  toggle: () => void;
}

export const useConnectivity = create<ConnectivityState>((set) => ({
  isOnline: true,
  setOnline: (v) => set({ isOnline: v }),
  toggle: () => set((s) => ({ isOnline: !s.isOnline })),
}));

/** Acesso fora de componentes (serviços). */
export const isOnline = () => useConnectivity.getState().isOnline;
