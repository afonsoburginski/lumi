import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ACTIVE_VOICE_PRESETS, DEFAULT_VOICE_ID, type VoicePresetDef } from '@lumi/shared';

import { zustandStorage } from '@/lib/storage';

/**
 * Vozes de narração: catálogo de presets profissionais (ElevenLabs + Gemini),
 * definido em @lumi/shared/voices. Sem clonagem (removida). O servidor roteia
 * cada preset ao seu provider.
 */
interface VoiceState {
  selectedVoiceId: string;
  allVoices: () => VoicePresetDef[];
  select: (id: string) => void;
}

export const useVoice = create<VoiceState>()(
  persist(
    (set) => ({
      selectedVoiceId: DEFAULT_VOICE_ID,
      allVoices: () => ACTIVE_VOICE_PRESETS,
      select: (id) => set({ selectedVoiceId: id }),
    }),
    {
      name: 'lumi-voice',
      storage: zustandStorage,
      version: 2,
      // v2: catálogo de presets profissionais (sem clonagem) — reseta a seleção antiga.
      migrate: () => ({ selectedVoiceId: DEFAULT_VOICE_ID }),
    },
  ),
);
