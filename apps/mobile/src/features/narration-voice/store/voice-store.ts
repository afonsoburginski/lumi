import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ACTIVE_VOICE_PRESETS, DEFAULT_VOICE_ID, type VoicePresetDef } from '@lumi/shared';

import { zustandStorage } from '@/lib/storage';

/**
 * Vozes de narração: catálogo (ElevenLabs profissionais + Gemini) definido em
 * @lumi/shared/voices. Sem clonagem. O servidor roteia cada preset ao seu
 * provider — strict, sem fallback cross-vendor.
 *
 * `availableByStory` registra as vozes que JÁ ESTÃO no R2 pra cada história
 * (vem do manifest). O picker só mostra essas — vozes ainda não pré-bakeadas
 * ficam ocultas em vez de tocar voz errada (fallback morto).
 */
interface VoiceState {
  selectedVoiceId: string;
  /** voiceIds disponíveis por storyId (vindos do manifest do R2). */
  availableByStory: Record<string, string[]>;
  allVoices: () => VoicePresetDef[];
  /** Vozes oferecidas pra uma história — filtra pelas disponíveis no R2.
   *  Sem registro ainda → devolve o catálogo inteiro (cold-start). */
  voicesForStory: (storyId: string) => VoicePresetDef[];
  select: (id: string) => void;
  setAvailableVoices: (storyId: string, voiceIds: string[]) => void;
}

export const useVoice = create<VoiceState>()(
  persist(
    (set, get) => ({
      selectedVoiceId: DEFAULT_VOICE_ID,
      availableByStory: {},
      allVoices: () => ACTIVE_VOICE_PRESETS,
      voicesForStory: (storyId) => {
        const ids = get().availableByStory[storyId];
        if (!ids || ids.length === 0) return ACTIVE_VOICE_PRESETS;
        const set = new Set(ids);
        return ACTIVE_VOICE_PRESETS.filter((v) => set.has(v.id));
      },
      select: (id) => set({ selectedVoiceId: id }),
      setAvailableVoices: (storyId, voiceIds) =>
        set((state) => ({
          availableByStory: { ...state.availableByStory, [storyId]: voiceIds },
        })),
    }),
    {
      name: 'lumi-voice',
      storage: zustandStorage,
      version: 3,
      // v3: catálogo 5 ElevenLabs (carla default) + 3 Gemini. Reseta seleção antiga.
      migrate: () => ({
        selectedVoiceId: DEFAULT_VOICE_ID,
        availableByStory: {},
      }),
    },
  ),
);
