import { useCallback, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';

import { fetchNarration } from '@/features/narration-voice/services/narration';

const SAMPLE = 'Oi! Era uma vez uma estrelinha que adorava contar histórias para dormir.';

/**
 * Preview de voz: sintetiza uma frase curta com o voiceId e toca, pra confirmar
 * que a voz funciona antes de selecionar. Cacheia por voz (1ª vez sintetiza,
 * depois é instantâneo/offline). `errorId` marca vozes que falharam (ex.: voz
 * library do ElevenLabs sem upgrade).
 */
export function useVoicePreview() {
  const player = useAudioPlayer(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const preview = useCallback(
    async (voiceId: string) => {
      setErrorId(null);
      setLoadingId(voiceId);
      try {
        const r = await fetchNarration({ text: SAMPLE, voiceId });
        if (r.audioUri) {
          player.replace({ uri: r.audioUri });
          player.seekTo(0);
          player.play();
        } else {
          setErrorId(voiceId);
        }
      } catch {
        setErrorId(voiceId);
      } finally {
        setLoadingId(null);
      }
    },
    [player],
  );

  return { preview, loadingId, errorId };
}
