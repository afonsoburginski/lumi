import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { fetchNarration } from '@/features/narration-voice/services/narration';
import { config } from '@/config';
import type { StoryPage, WordTiming } from '@/types/domain';

/**
 * Controller de narração — SÓ voz profissional (ElevenLabs/Gemini via API).
 *
 * INTENÇÃO DE TOCAR (`wantPlaying`) desacoplada do carregamento assíncrono do
 * áudio: o usuário pode tocar/pausar (ou trocar a voz) ANTES do arquivo existir;
 * quando o áudio carrega, respeitamos a intenção atual. Isso elimina os bugs de
 * "troquei o narrador e cliquei em play e não rolou" e "trocou de página sozinho
 * e tive que clicar no play".
 *
 * Player ÚNICO controlado explicitamente: a cada página/voz, `player.replace(uri)`
 * (o expo-audio NÃO troca a fonte sozinho ao mudar o argumento). Tokens: sintetiza
 * só a página aberta (lazy) e cacheia por página+voz — reler não re-sintetiza.
 */

const MS_PER_WORD = 380; // estimativa do scrubber antes do áudio carregar
const PAGE_PAUSE_MS = 1100; // respiro entre páginas antes do auto-avanço
const END_EPS = 0.25; // s — margem p/ considerar "terminou"

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
  const [wantPlaying, setWantPlaying] = useState(autoPlay);

  const effectiveUri = page.audioUri ?? lazyUri;
  const shouldLazy = !page.audioUri && !config.useMocks;

  // player único; trocamos a fonte por replace() (controle explícito)
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const finishedRef = useRef(false);
  const loadedUriRef = useRef<string | null>(null);
  const wantPlayingRef = useRef(wantPlaying);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  });
  useEffect(() => {
    wantPlayingRef.current = wantPlaying;
  }, [wantPlaying]);

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

  // Troca de página OU de voz → re-sintetiza (lazy + cache) e zera o estado.
  // Voltamos a "querer tocar" (autoPlay): nova página/voz narra sozinha.
  useEffect(() => {
    let cancelled = false;
    finishedRef.current = false;
    loadedUriRef.current = null;
    clearPauseTimer();
    try {
      player.pause(); // corta o áudio anterior na hora
    } catch {
      /* ignore */
    }
    setLazyUri(null);
    setWantPlaying(autoPlay);

    if (!page.audioUri && shouldLazy) {
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

  // Carrega a fonte quando o áudio fica pronto; toca SE a intenção atual é tocar.
  useEffect(() => {
    if (!effectiveUri || loadedUriRef.current === effectiveUri) return;
    loadedUriRef.current = effectiveUri;
    finishedRef.current = false;
    try {
      player.replace({ uri: effectiveUri });
      player.seekTo(0);
      if (wantPlayingRef.current) player.play();
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUri]);

  // Auto-avanço ao terminar — robusto a `didJustFinish` stale (usa posição também).
  useEffect(() => {
    if (!loadedUriRef.current) return;
    const dur = status.duration ?? 0;
    const atEnd = dur > 0 && (status.currentTime ?? 0) >= dur - END_EPS;
    const ended = status.didJustFinish || (status.isLoaded && !status.playing && atEnd);
    if (ended) finishWithPause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish, status.playing, status.currentTime, status.duration, status.isLoaded]);

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
    setWantPlaying((want) => {
      const next = !want;
      try {
        if (next) {
          const dur = status.duration ?? 0;
          if (dur > 0 && (status.currentTime ?? 0) >= dur - END_EPS) player.seekTo(0); // recomeça se terminou
          finishedRef.current = false;
          if (loadedUriRef.current) player.play(); // se ainda carregando, toca no load
        } else {
          player.pause();
          clearPauseTimer();
        }
      } catch {
        /* ignore */
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.currentTime, status.duration]);

  const seek = useCallback(
    (ms: number) => {
      if (!loadedUriRef.current) return;
      player.seekTo(Math.max(0, Math.min(ms, durationMs)) / 1000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [durationMs],
  );

  return {
    // mostra "tocando" pela intenção enquanto prepara (botão responsivo), e pelo
    // status real depois de carregado.
    isPlaying: status.playing || (wantPlaying && preparing),
    preparing,
    positionMs,
    durationMs,
    activeWordIndex,
    wordTimings,
    togglePlay,
    seek,
  };
}
