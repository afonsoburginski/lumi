import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { useShallow } from 'zustand/react/shallow';

import { useVoice } from '@/features/narration-voice/store/voice-store';
import { spacing } from '@/theme/tokens';
import type { Story } from '@/types/domain';

import { useBookPager } from '../hooks/use-book-pager';
import { useNarration } from '../hooks/use-narration';
import { useAutoHideChrome } from '../hooks/use-auto-hide-chrome';
import { BOOK, bookSize, barTotalHeight } from './book/constants';
import { Illustration, TextPage } from './book/book-page';
import { BookTopBar } from './book/book-top-bar';

interface Props {
  story: Story;
  initialPage?: number;
  onClose?: () => void;
}

/**
 * Player LANDSCAPE estilo Gemini Storybook (orquestrador). Modo BLOQUEIO INFANTIL:
 * toques na página NÃO pausam nem navegam (a criança mexe na tela sem interromper)
 * — só alternam os controles, que ficam ocultos e aparecem/somem suavemente. Sair
 * = X; navegar = setas. A barra NÃO sobrepõe o livro (reserva sua altura). Tela
 * permanece acordada. Compõe paginação + narração + componentes do livro.
 */
export default function StoryBookPlayer({ story, initialPage = 0, onClose }: Props) {
  useKeepAwake(); // tela não dorme durante a história

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pages = story.pages;
  const author = (story.authorName ?? 'Lumi').toUpperCase();

  const { currentPage, turn, goNext, goPrev, flip, dir } = useBookPager(pages.length, initialPage);
  const { visible, show, toggle } = useAutoHideChrome();

  const voices = useVoice(useShallow((s) => s.allVoices()));
  const selectedVoiceId = useVoice((s) => s.selectedVoiceId);
  const selectVoice = useVoice((s) => s.select);
  const activeVoice = voices.find((v) => v.id === selectedVoiceId) ?? voices[0];

  const { isPlaying, togglePlay } = useNarration(pages[currentPage], selectedVoiceId, {
    autoPlay: true,
    onFinished: () => {
      if (currentPage < pages.length - 1) goNext();
    },
  });

  // Navegação/controles reexibem a barra (e reiniciam o timer de auto-ocultar).
  const handlePrev = useCallback(() => {
    show();
    goPrev();
  }, [show, goPrev]);
  const handleNext = useCallback(() => {
    show();
    goNext();
  }, [show, goNext]);
  const handleToggle = useCallback(() => {
    show();
    togglePlay();
  }, [show, togglePlay]);
  const handleCycleVoice = useCallback(() => {
    show();
    const idx = voices.findIndex((v) => v.id === selectedVoiceId);
    const next = voices[(idx + 1) % voices.length];
    if (next) selectVoice(next.id);
  }, [show, voices, selectedVoiceId, selectVoice]);

  // animações de virar a folha (na lombada esquerda da página direita)
  const leafStyle = useAnimatedStyle(() => {
    const f = flip.value;
    const deg = (dir.value === 1 ? -180 : 180) * f;
    const opacity = f < 0.55 ? 1 : Math.max(0, 1 - (f - 0.55) * 2.4);
    return { opacity, transform: [{ perspective: 1400 }, { rotateY: `${deg}deg` }] };
  });
  const leftCoverStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.45 ? 1 : Math.max(0, 1 - (flip.value - 0.45) * 2),
  }));
  const leafShadeStyle = useAnimatedStyle(() => ({ opacity: Math.sin(flip.value * Math.PI) * 0.22 }));

  // barra aparece/some suavemente (fade + leve slide), sem mexer no layout do livro
  const chrome = useSharedValue(1);
  useEffect(() => {
    chrome.value = withTiming(visible ? 1 : 0, { duration: 220 });
  }, [visible, chrome]);
  const barStyle = useAnimatedStyle(() => ({
    opacity: chrome.value,
    transform: [{ translateY: (chrome.value - 1) * 14 }],
  }));

  // Livro centralizado ABAIXO da barra (ela nunca tampa a ilustração/texto).
  // Margem horizontal respeita o notch; a vertical é pequena (mais altura pro livro).
  const barH = barTotalHeight(insets.top);
  const marginX = Math.max(insets.left, insets.right, 12);
  const marginY = 8;
  const availW = width - marginX * 2;
  const availH = height - barH - marginY * 2;
  const { width: bookW, height: bookH, half } = bookSize(availW, availH);
  const barPadH = Math.max((width - bookW) / 2, spacing.sm);

  const src = pages[currentPage];
  const dest = turn ? pages[turn.to] : pages[currentPage];

  return (
    <View style={[styles.root, { backgroundColor: BOOK.backdrop }]}>
      <StatusBar hidden animated />

      {/* Toque em qualquer lugar do livro: só alterna a barra (não pausa/navega) */}
      <Pressable style={[styles.stage, { paddingTop: barH }]} onPress={toggle}>
        <View style={[styles.book, { width: bookW, height: bookH }]}>
          <View style={styles.leftPage}>
            <Illustration page={dest} />
          </View>
          <View style={styles.rightPage}>
            <TextPage page={dest} author={author} />
          </View>

          {turn ? (
            <Reanimated.View style={[styles.leftPage, leftCoverStyle]}>
              <Illustration page={src} />
            </Reanimated.View>
          ) : null}

          {turn ? (
            <Reanimated.View style={[styles.rightPage, styles.leaf, { width: half }, leafStyle]}>
              <TextPage page={src} author={author} />
              <Reanimated.View
                style={[StyleSheet.absoluteFill, styles.leafShade, leafShadeStyle]}
                pointerEvents="none"
              />
            </Reanimated.View>
          ) : null}

          <View style={[styles.spine, { left: half - 1 }]} pointerEvents="none" />
        </View>
      </Pressable>

      {/* Barra que aparece/some: X sai, setas navegam, play e troca de voz */}
      <Reanimated.View style={[styles.barWrap, barStyle]} pointerEvents={visible ? 'auto' : 'none'}>
        <BookTopBar
          title={story.title}
          page={currentPage}
          total={pages.length}
          isPlaying={isPlaying}
          voiceLabel={activeVoice?.label}
          paddingHorizontal={barPadH}
          onClose={onClose}
          onPrev={handlePrev}
          onNext={handleNext}
          onTogglePlay={handleToggle}
          onCycleVoice={handleCycleVoice}
        />
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  barWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  book: {
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: BOOK.paper,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  leftPage: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  rightPage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    backgroundColor: BOOK.paper,
  },
  leaf: { left: '50%', right: undefined, transformOrigin: 'left', backfaceVisibility: 'hidden' },
  leafShade: { backgroundColor: '#000', borderRadius: 10 },
  spine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.18)' },
});
