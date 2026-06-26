import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { fetchNarration } from '@/features/narration-voice/services/narration';
import { config } from '@/config';
import type { StoryPage, WordTiming } from '@/types/domain';

/**
 * Controller de narração — SÓ voz profissional (ElevenLabs/Gemini via API).
 * Toca o áudio pré-gerado da página (`audioUri`) ou busca sob demanda quando há
 * backend; cacheia. Sem expo-speech (nada de voz robótica). Karaokê proporcional
 * à duração real do áudio + "respiro" entre páginas antes do auto-avanço.
 */

const MS_PER_WORD = 380; // estimativa só p/ o scrubber antes do áudio carregar
const PAGE_PAUSE_MS = 1200;

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export interface NarrationOptions {
  autoPlay?: boolean;
  onFinished?: () => void;
}

export interface Narration {
  isPlaying: boolean;
  preparing: boolean;
  positionMs: number;
  durationMs: number;
  activeWordIndex: number;
  wordTimings: WordTiming[];
  togglePlay: () => void;
  seek: (ms: number) => void;
}

export function useNarration(page: StoryPage, voiceId: string, opts: NarrationOptions = {}): Narration {
  const { autoPlay = true, onFinished } = opts;

  const words = useMemo(() => splitWords(page.text), [page.text]);
  const wordTimings = useMemo<WordTiming[]>(
    () => words.map((w, i) => ({ word: w, startMs: i * MS_PER_WORD, endMs: (i + 1) * MS_PER_WORD })),
    [words],
  );
  const estDuration = Math.max(words.length * MS_PER_WORD, 1500);

  const [lazyUri, setLazyUri] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const effectiveUri = page.audioUri ?? lazyUri;
  const shouldLazy = !page.audioUri && !config.useMocks;

  const player = useAudioPlayer(effectiveUri ? { uri: effectiveUri } : null);
  const status = useAudioPlayerStatus(player);

  const finishedRef = useRef(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  });

  const clearPauseTimer = () => {
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = null;
  };

  const finishWithPause = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearPauseTimer();
    pauseTimer.current = setTimeout(() => onFinishedRef.current?.(), PAGE_PAUSE_MS);
  }, []);

  // Reset + busca da narração ao trocar de página (ou de voz).
  useEffect(() => {
    finishedRef.current = false;
    clearPauseTimer();
    setLazyUri(null);

    let cancelled = false;
    if (page.audioUri) {
      setPreparing(false);
    } else if (shouldLazy) {
      setPreparing(true);
      fetchNarration(page.text, voiceId, `lazy-${page.id}-${voiceId}`)
        .then((r) => {
          if (cancelled) return;
          setPreparing(false);
          if (r.audioUri) setLazyUri(r.audioUri);
        })
        .catch(() => {
          if (!cancelled) setPreparing(false);
        });
    } else {
      setPreparing(false);
    }

    return () => {
      cancelled = true;
      clearPauseTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id, voiceId]);

  // Autoplay quando o áudio carrega.
  useEffect(() => {
    if (autoPlay && status.isLoaded && !status.playing && (status.currentTime ?? 0) === 0) {
      player.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.isLoaded, effectiveUri]);

  // Auto-avanço ao terminar.
  useEffect(() => {
    if (status.didJustFinish) finishWithPause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  // Pausa ao mandar o app pro background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active' && status.playing) player.pause();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const durationMs = (status.duration ?? 0) * 1000 || estDuration;
  const positionMs = (status.currentTime ?? 0) * 1000;
  const activeWordIndex =
    words.length > 0 && durationMs > 0
      ? Math.min(words.length - 1, Math.floor((positionMs / durationMs) * words.length))
      : -1;

  const togglePlay = useCallback(() => {
    if (preparing || !effectiveUri) return;
    if (status.playing) player.pause();
    else player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preparing, effectiveUri, status.playing]);

  const seek = useCallback(
    (ms: number) => {
      if (!effectiveUri) return;
      player.seekTo(Math.max(0, Math.min(ms, durationMs)) / 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveUri, durationMs],
  );

  return {
    isPlaying: preparing || status.playing,
    preparing,
    positionMs,
    durationMs,
    activeWordIndex,
    wordTimings,
    togglePlay,
    seek,
  };
}
