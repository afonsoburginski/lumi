import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import * as speech from '@/features/narration-voice/services/speech';
import type { StoryPage, WordTiming } from '@/types/domain';

/**
 * Controller de narração compartilhado pelos dois players.
 * - Caminho A (premium): se a página tem `audioUri` (áudio pré-gerado pelo Gemini
 *   e cacheado), toca com expo-audio; karaokê proporcional à duração real.
 * - Caminho B (fallback): expo-speech on-device (offline / sem áudio), com
 *   `onBoundary` p/ karaokê e timer estimado de segurança.
 * Em ambos há um "respiro" entre páginas (crianças) antes do auto-avanço.
 */

const MS_PER_WORD = 360;
const TICK_MS = 50;
const EMPTY_PAGE_MS = 700;
const SAFETY_MS = 4000;
const PAGE_PAUSE_MS = 1200; // respiro entre páginas antes de virar

interface Word {
  word: string;
  charStart: number;
  startMs: number;
  endMs: number;
}

function buildWords(text: string): Word[] {
  const out: Word[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    out.push({ word: m[0], charStart: m.index, startMs: i * MS_PER_WORD, endMs: (i + 1) * MS_PER_WORD });
    i++;
  }
  return out;
}

function indexAtChar(words: Word[], charIndex: number): number {
  let idx = 0;
  for (let i = 0; i < words.length; i++) {
    if (words[i].charStart <= charIndex) idx = i;
    else break;
  }
  return idx;
}

function indexAtMs(words: Word[], ms: number): number {
  let idx = 0;
  for (let i = 0; i < words.length; i++) {
    if (words[i].startMs <= ms) idx = i;
    else break;
  }
  return idx;
}

export interface NarrationOptions {
  autoPlay?: boolean;
  onFinished?: () => void;
}

export interface Narration {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  activeWordIndex: number;
  wordTimings: WordTiming[];
  togglePlay: () => void;
  seek: (ms: number) => void;
}

export function useNarration(page: StoryPage, voiceId: string, opts: NarrationOptions = {}): Narration {
  const { autoPlay = true, onFinished } = opts;

  const words = useMemo(() => buildWords(page.text), [page.text]);
  const wordTimings = useMemo<WordTiming[]>(
    () => words.map((w) => ({ word: w.word, startMs: w.startMs, endMs: w.endMs })),
    [words],
  );
  const speechDuration = words.length > 0 ? words.length * MS_PER_WORD : EMPTY_PAGE_MS;

  // ---- Áudio premium (pré-gerado + cacheado) ----
  const hasAudio = Boolean(page.audioUri);
  const audioPlayer = useAudioPlayer(page.audioUri ? { uri: page.audioUri } : null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [positionMs, setPositionMs] = useState(0);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);

  const utterance = useRef(0);
  const boundaryFired = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsed = useRef(0);
  const posRef = useRef(0);
  const activeRef = useRef(-1);
  const playingRef = useRef(autoPlay);
  const finishedRef = useRef(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  });

  const clearTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  };
  const clearPauseTimer = () => {
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = null;
  };

  const setPlaying = (v: boolean) => {
    playingRef.current = v;
    setIsPlaying(v);
  };

  // Avanço com respiro entre páginas (uma vez por página).
  const finishWithPause = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearPauseTimer();
    pauseTimer.current = setTimeout(() => onFinishedRef.current?.(), PAGE_PAUSE_MS);
  }, []);

  /* ===================== Caminho B: expo-speech ===================== */

  const finishSpeech = useCallback(() => {
    clearTick();
    utterance.current++;
    speech.stop();
    setPlaying(false);
    posRef.current = speechDuration;
    setPositionMs(speechDuration);
    activeRef.current = words.length - 1;
    setActiveWordIndex(words.length - 1);
    finishWithPause();
  }, [words.length, speechDuration, finishWithPause]);

  const startTimer = useCallback(() => {
    clearTick();
    tickRef.current = setInterval(() => {
      elapsed.current += TICK_MS;
      if (!boundaryFired.current) {
        posRef.current = elapsed.current;
        setPositionMs(elapsed.current);
        const idx = words.length ? indexAtMs(words, elapsed.current) : -1;
        if (idx !== activeRef.current) {
          activeRef.current = idx;
          setActiveWordIndex(idx);
        }
        if (elapsed.current >= speechDuration) finishSpeech();
      } else {
        posRef.current = Math.min(posRef.current + TICK_MS, speechDuration);
        setPositionMs(posRef.current);
        if (elapsed.current >= speechDuration + SAFETY_MS) finishSpeech();
      }
    }, TICK_MS);
  }, [words, speechDuration, finishSpeech]);

  const playSpeech = useCallback(() => {
    setPlaying(true);
    elapsed.current = activeRef.current >= 0 ? words[activeRef.current]?.startMs ?? 0 : 0;
    if (words.length === 0) {
      startTimer();
      return;
    }
    boundaryFired.current = false;
    const myId = ++utterance.current;
    const baseChar = activeRef.current >= 0 ? words[activeRef.current].charStart : 0;
    speech.speak(page.text.slice(baseChar), voiceId, {
      onBoundary: (charIndex) => {
        if (myId !== utterance.current) return;
        boundaryFired.current = true;
        const idx = indexAtChar(words, baseChar + charIndex);
        activeRef.current = idx;
        setActiveWordIndex(idx);
        posRef.current = words[idx]?.startMs ?? posRef.current;
        setPositionMs(posRef.current);
      },
      onDone: () => {
        if (myId !== utterance.current) return;
        finishSpeech();
      },
    });
    startTimer();
  }, [words, page.text, voiceId, finishSpeech, startTimer]);

  const pauseSpeech = useCallback(() => {
    utterance.current++;
    speech.stop();
    clearTick();
    setPlaying(false);
  }, []);

  /* ===================== Reset + autoplay por página ===================== */

  useEffect(() => {
    finishedRef.current = false;
    clearPauseTimer();
    if (hasAudio) {
      // o áudio recarrega com o novo source; autoplay tratado no efeito abaixo
      return () => {
        clearPauseTimer();
      };
    }
    // caminho expo-speech
    utterance.current++;
    speech.stop();
    clearTick();
    boundaryFired.current = false;
    elapsed.current = 0;
    posRef.current = 0;
    activeRef.current = -1;
    setPositionMs(0);
    setActiveWordIndex(-1);
    if (autoPlay) playSpeech();
    else setPlaying(false);
    return () => {
      utterance.current++;
      speech.stop();
      clearTick();
      clearPauseTimer();
    };
    // só reage à troca de página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id, hasAudio]);

  // Autoplay do áudio premium quando carrega.
  useEffect(() => {
    if (hasAudio && autoPlay && audioStatus.isLoaded && !audioStatus.playing && (audioStatus.currentTime ?? 0) === 0) {
      audioPlayer.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAudio, audioStatus.isLoaded]);

  // Auto-avanço do áudio premium ao terminar.
  useEffect(() => {
    if (hasAudio && audioStatus.didJustFinish) finishWithPause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAudio, audioStatus.didJustFinish]);

  // Trocar a voz no meio da página (só caminho expo-speech).
  const voiceRef = useRef(voiceId);
  useEffect(() => {
    if (voiceRef.current === voiceId) return;
    voiceRef.current = voiceId;
    if (!hasAudio && playingRef.current) {
      utterance.current++;
      speech.stop();
      playSpeech();
    }
  }, [voiceId, hasAudio, playSpeech]);

  // Pausa ao mandar o app pro background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') return;
      if (hasAudio) audioPlayer.pause();
      else if (playingRef.current) pauseSpeech();
    });
    return () => sub.remove();
  }, [hasAudio, audioPlayer, pauseSpeech]);

  /* ===================== Saída ===================== */

  if (hasAudio) {
    const durationMs = (audioStatus.duration ?? 0) * 1000 || speechDuration;
    const pos = (audioStatus.currentTime ?? 0) * 1000;
    const idx =
      words.length > 0 ? Math.min(words.length - 1, Math.floor((pos / Math.max(durationMs, 1)) * words.length)) : -1;
    return {
      isPlaying: audioStatus.playing,
      positionMs: pos,
      durationMs,
      activeWordIndex: idx,
      wordTimings,
      togglePlay: () => (audioStatus.playing ? audioPlayer.pause() : audioPlayer.play()),
      seek: (ms: number) => audioPlayer.seekTo(Math.max(0, Math.min(ms, durationMs)) / 1000),
    };
  }

  const togglePlay = () => {
    if (playingRef.current) {
      pauseSpeech();
      return;
    }
    if (activeRef.current >= words.length - 1 && posRef.current >= speechDuration) {
      activeRef.current = -1;
      setActiveWordIndex(-1);
      posRef.current = 0;
      setPositionMs(0);
    }
    finishedRef.current = false;
    playSpeech();
  };

  const seek = (ms: number) => {
    const clamped = Math.max(0, Math.min(ms, speechDuration));
    const i = words.length ? indexAtMs(words, clamped) : -1;
    activeRef.current = i;
    setActiveWordIndex(i);
    posRef.current = clamped;
    setPositionMs(clamped);
    elapsed.current = clamped;
    if (playingRef.current) {
      utterance.current++;
      speech.stop();
      playSpeech();
    }
  };

  return { isPlaying, positionMs, durationMs: speechDuration, activeWordIndex, wordTimings, togglePlay, seek };
}
