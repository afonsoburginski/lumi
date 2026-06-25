import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';
import { uid } from '@/lib/id';
import { isOnline } from '@/lib/net/connectivity';
import { useSync } from '@/lib/services/sync';
import type { VoiceProfile } from '@/types/domain';

/** Presets de voz de IA (offline: disponíveis como rótulos). */
export const VOICE_PRESETS: VoiceProfile[] = [
  {
    id: 'preset-epico',
    ownerId: 'system',
    type: 'preset',
    label: '🎙️ Narrador Épico',
    providerVoiceId: 'epic',
    status: 'ready',
    createdAt: 0,
  },
  {
    id: 'preset-fada',
    ownerId: 'system',
    type: 'preset',
    label: '🧚 Fada',
    providerVoiceId: 'fairy',
    status: 'ready',
    createdAt: 0,
  },
  {
    id: 'preset-vovo',
    ownerId: 'system',
    type: 'preset',
    label: '👴 Vovô',
    providerVoiceId: 'grandpa',
    status: 'ready',
    createdAt: 0,
  },
];

interface VoiceState {
  cloned: VoiceProfile[];
  selectedVoiceId: string;
  allVoices: () => VoiceProfile[];
  select: (id: string) => void;
  /** inicia clonagem (offline: fica 'processing' + outbox; online idem até backend) */
  addClonedVoice: (ownerId: string, label: string, consent: boolean) => VoiceProfile;
}

export const useVoice = create<VoiceState>()(
  persist(
    (set, get) => ({
      cloned: [],
      selectedVoiceId: 'preset-fada',
      allVoices: () => [...VOICE_PRESETS, ...get().cloned],
      select: (id) => set({ selectedVoiceId: id }),
      addClonedVoice: (ownerId, label, consent) => {
        const profile: VoiceProfile = {
          id: uid('voice_'),
          ownerId,
          type: 'cloned',
          label,
          providerVoiceId: 'pending',
          // offline-first: sem rede, marcamos pronto localmente (usa fallback de preset);
          // com rede, fica processando até o provider concluir.
          status: isOnline() ? 'processing' : 'ready',
          consent,
          createdAt: Date.now(),
        };
        set((st) => ({ cloned: [profile, ...st.cloned], selectedVoiceId: profile.id }));
        useSync.getState().enqueue('clone_voice', { id: profile.id, label });
        return profile;
      },
    }),
    { name: 'lumi-voice', storage: zustandStorage },
  ),
);
