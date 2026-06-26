import { useCallback, useRef, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import {
  Easing,
  runOnJS,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { BOOK } from '../components/book/constants';

const PAGE_TURN_SOUND = require('../../../../assets/page-turn.mp3');

export interface BookPager {
  currentPage: number;
  turn: { to: number; dir: 1 | -1 } | null;
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  flip: SharedValue<number>;
  dir: SharedValue<1 | -1>;
}

/**
 * Paginação do livrinho: índice atual + animação de virar a folha (na lombada)
 * + som de papel. Uma virada por vez (turningRef). Responsabilidade única.
 */
export function useBookPager(pageCount: number, initial = 0): BookPager {
  const [currentPage, setCurrentPage] = useState(initial);
  const [turn, setTurn] = useState<{ to: number; dir: 1 | -1 } | null>(null);
  const flip = useSharedValue(0);
  const dir = useSharedValue<1 | -1>(1);
  const turningRef = useRef(false);

  const turnSound = useAudioPlayer(PAGE_TURN_SOUND);
  const playTurnSound = useCallback(() => {
    try {
      turnSound.seekTo(0);
      turnSound.play();
    } catch {
      /* sem efeito sonoro */
    }
  }, [turnSound]);

  const commit = useCallback(
    (to: number) => {
      setCurrentPage(to);
      setTurn(null);
      flip.value = 0;
      turningRef.current = false;
    },
    [flip],
  );

  const goTo = useCallback(
    (to: number) => {
      if (turningRef.current || to < 0 || to >= pageCount || to === currentPage) return;
      const d: 1 | -1 = to > currentPage ? 1 : -1;
      turningRef.current = true;
      dir.value = d;
      setTurn({ to, dir: d });
      playTurnSound();
      flip.value = 0;
      flip.value = withTiming(1, { duration: BOOK.flipMs, easing: Easing.inOut(Easing.ease) }, (done) => {
        if (done) runOnJS(commit)(to);
      });
    },
    [pageCount, currentPage, playTurnSound, commit, dir, flip],
  );

  const goNext = useCallback(() => goTo(currentPage + 1), [goTo, currentPage]);
  const goPrev = useCallback(() => goTo(currentPage - 1), [goTo, currentPage]);

  return { currentPage, turn, goNext, goPrev, goTo, flip, dir };
}
