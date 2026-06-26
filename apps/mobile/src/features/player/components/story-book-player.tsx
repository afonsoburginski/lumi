import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import Reanimated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2 } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';

import { Icon } from '@/components/ui/icon';
import { useVoice } from '@/features/narration-voice/store/voice-store';
import { fonts } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';
import type { Story, StoryPage } from '@/types/domain';

import { HoldToClose } from './hold-to-close';
import { useNarration } from '../hooks/use-narration';

const PAGE_TURN_SOUND = require('../../../../assets/page-turn.wav');

interface Props {
  story: Story;
  initialPage?: number;
  onClose?: () => void;
}

// Paleta do "livro físico" (espelha o Gemini Storybook).
const BACKDROP = '#33373F'; // mesa escura atrás do livro
const BAR = '#22252C'; // barra superior
const BAR_INK = '#E8E6E1';
const BAR_MUTED = '#9BA0A8';
const PAPER = '#F5EFE1'; // papel creme
const INK = '#2B2A28'; // tinta do texto
const INK_SOFT = '#9A958A'; // autor / nº página
const PLAY_BLUE = '#4F86F7';
const FLIP_MS = 640;

/**
 * Player LANDSCAPE estilo Gemini Storybook: spread de duas páginas — ilustração
 * full-bleed à esquerda, papel creme com texto serifado (drop-cap, autor, nº da
 * página, cantinho dobrado) à direita. Virar página = a folha de texto gira na
 * lombada + a ilustração faz cross-fade, com som de papel. Narração suave por
 * baixo (useNarration). Tocar nas bordas vira a página.
 */
export default function StoryBookPlayer({ story, initialPage = 0, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pages = story.pages;
  const author = (story.authorName ?? 'Lumi').toUpperCase();

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [turn, setTurn] = useState<{ to: number; dir: 1 | -1 } | null>(null);

  const voices = useVoice(useShallow((s) => s.allVoices()));
  const selectedVoiceId = useVoice((s) => s.selectedVoiceId);
  const selectVoice = useVoice((s) => s.select);
  const activeVoice = voices.find((v) => v.id === selectedVoiceId) ?? voices[0];

  // som de virar a folha
  const turnSound = useAudioPlayer(PAGE_TURN_SOUND);
  const playTurnSound = useCallback(() => {
    try {
      turnSound.seekTo(0);
      turnSound.play();
    } catch {
      /* sem efeito sonoro — ignora */
    }
  }, [turnSound]);

  // animação de virar página (folha da direita gira na lombada; ilustração cross-fade)
  const flip = useSharedValue(0);
  const dir = useSharedValue<1 | -1>(1);
  const turningRef = useRef(false);

  const commitTurn = useCallback((to: number) => {
    setCurrentPage(to);
    setTurn(null);
    flip.value = 0;
    turningRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTurn = useCallback(
    (to: number, d: 1 | -1) => {
      if (turningRef.current || to < 0 || to >= pages.length) return;
      turningRef.current = true;
      dir.value = d;
      setTurn({ to, dir: d });
      playTurnSound();
      flip.value = 0;
      flip.value = withTiming(1, { duration: FLIP_MS, easing: Easing.inOut(Easing.ease) }, (done) => {
        if (done) runOnJS(commitTurn)(to);
      });
    },
    [pages.length, playTurnSound, commitTurn, dir, flip],
  );

  const goNext = useCallback(() => startTurn(currentPage + 1, 1), [startTurn, currentPage]);
  const goPrev = useCallback(() => startTurn(currentPage - 1, -1), [startTurn, currentPage]);

  const { isPlaying, togglePlay } = useNarration(pages[currentPage], selectedVoiceId, {
    autoPlay: true,
    onFinished: () => {
      if (currentPage < pages.length - 1) goNext();
    },
  });

  const cycleVoice = useCallback(() => {
    const idx = voices.findIndex((v) => v.id === selectedVoiceId);
    const next = voices[(idx + 1) % voices.length];
    if (next) selectVoice(next.id);
  }, [voices, selectedVoiceId, selectVoice]);

  // ---- Barra com auto-hide (foco): some sozinha; toque no centro alterna ----
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showChrome = useCallback(() => {
    setChromeVisible(true);
    Animated.timing(chromeOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(chromeOpacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(
        () => setChromeVisible(false),
      );
    }, 3000);
  }, [chromeOpacity]);

  const toggleChrome = useCallback(() => {
    if (chromeVisible) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      Animated.timing(chromeOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(
        () => setChromeVisible(false),
      );
    } else {
      showChrome();
    }
  }, [chromeVisible, chromeOpacity, showChrome]);

  useEffect(() => {
    showChrome();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showChrome]);

  // toque: bordas viram a página; centro mostra/esconde a barra
  const onTapPage = useCallback(
    (e: GestureResponderEvent) => {
      const x = e.nativeEvent.locationX;
      if (x < width * 0.28) goPrev();
      else if (x > width * 0.72) goNext();
      else toggleChrome();
    },
    [width, goPrev, goNext, toggleChrome],
  );

  // ---- animações ----
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

  // ---- layout do livro: ocupa o MÁXIMO da tela (a barra fica por cima) ----
  const barH = insets.top + 44;
  const m = 8;
  const availH = height - m * 2;
  const availW = width - Math.max(insets.left, insets.right, m) * 2;
  const AR = 2.0; // largura:altura do spread (2 páginas)
  let bookW = availW;
  let bookH = bookW / AR;
  if (bookH > availH) {
    bookH = availH;
    bookW = bookH * AR;
  }
  const halfW = bookW / 2;

  const srcIndex = currentPage;
  const destIndex = turn ? turn.to : currentPage;

  return (
    <View style={[styles.root, { backgroundColor: BACKDROP }]}>
      {/* ---- Livro (ocupa a tela toda; a barra fica por cima e some sozinha) ---- */}
      <View style={styles.stage}>
        <Pressable onPress={onTapPage} style={[styles.book, { width: bookW, height: bookH }]}>
          <View style={styles.leftPage}>
            <Illustration page={pages[destIndex]} />
          </View>
          <View style={styles.rightPage}>
            <TextPage page={pages[destIndex]} author={author} />
          </View>

          {turn ? (
            <Reanimated.View style={[styles.leftPage, leftCoverStyle]}>
              <Illustration page={pages[srcIndex]} />
            </Reanimated.View>
          ) : null}

          {turn ? (
            <Reanimated.View style={[styles.rightPage, styles.leaf, { width: halfW }, leafStyle]}>
              <TextPage page={pages[srcIndex]} author={author} />
              <Reanimated.View style={[StyleSheet.absoluteFill, styles.leafShade, leafShadeStyle]} pointerEvents="none" />
            </Reanimated.View>
          ) : null}

          <View style={[styles.spine, { left: halfW - 1 }]} pointerEvents="none" />
        </Pressable>
      </View>

      {/* ---- Barra superior (estilo Gemini, auto-hide por cima) ---- */}
      {chromeVisible ? (
        <Animated.View
          style={[styles.bar, { height: barH, paddingTop: insets.top, opacity: chromeOpacity }]}
        >
          <View style={styles.barSide}>
            <HoldToClose onClose={onClose} />
            <RNText style={styles.title} numberOfLines={1}>
              {story.title}
            </RNText>
          </View>

          <View style={styles.pager}>
            <Pressable onPress={goPrev} hitSlop={8} accessibilityLabel="Página anterior">
              <Icon name={ChevronLeft} color={currentPage > 0 ? BAR_INK : BAR_MUTED} size={20} />
            </Pressable>
            <RNText style={styles.pagerText}>
              {currentPage + 1}/{pages.length}
            </RNText>
            <Pressable onPress={goNext} hitSlop={8} accessibilityLabel="Próxima página">
              <Icon
                name={ChevronRight}
                color={currentPage < pages.length - 1 ? BAR_INK : BAR_MUTED}
                size={20}
              />
            </Pressable>
          </View>

          <View style={[styles.barSide, styles.barRight]}>
            <Pressable onPress={cycleVoice} style={styles.voiceBtn} accessibilityLabel="Trocar voz">
              <Icon name={Volume2} color={BAR_INK} size={16} />
              {activeVoice ? <RNText style={styles.voiceTxt}>{activeVoice.label}</RNText> : null}
            </Pressable>
            <Pressable
              onPress={togglePlay}
              style={styles.playBtn}
              accessibilityLabel={isPlaying ? 'Pausar narração' : 'Ouvir narração'}
            >
              <Icon name={isPlaying ? Pause : Play} color="#FFFFFF" size={18} />
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Ilustração full-bleed da página (esquerda do spread). */
const Illustration = React.memo(({ page }: { page: StoryPage }) => (
  <Image source={{ uri: page.imageUri }} style={styles.illo} contentFit="cover" transition={120} />
));
Illustration.displayName = 'Illustration';

/** Página de papel creme: autor, texto serifado com drop-cap e cantinho dobrado. */
const TextPage = React.memo(({ page, author }: { page: StoryPage; author: string }) => {
  const first = page.text.slice(0, 1);
  const rest = page.text.slice(1);
  return (
    <View style={styles.paper}>
      <RNText style={styles.author}>{author}</RNText>
      <ScrollView
        style={styles.paperScroll}
        contentContainerStyle={styles.paperContent}
        showsVerticalScrollIndicator={false}
      >
        <RNText style={styles.body}>
          <RNText style={styles.dropCap}>{first}</RNText>
          {rest}
        </RNText>
      </ScrollView>
      <PageCurl />
    </View>
  );
});
TextPage.displayName = 'TextPage';

/** Cantinho dobrado da página (page-curl) no rodapé direito. */
function PageCurl() {
  return (
    <View style={styles.curl} pointerEvents="none">
      <Svg width={30} height={30} viewBox="0 0 30 30">
        {/* sombra do vinco */}
        <Path d="M30 0 L30 30 L0 30 Z" fill="rgba(0,0,0,0.10)" />
        {/* folha dobrada */}
        <Path d="M30 8 L30 30 L8 30 Z" fill="#FBF7EE" />
        <Path d="M30 8 L8 30" stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // barra superior (overlay absoluto, auto-hide)
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(34,37,44,0.94)',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  barSide: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 },
  barRight: { justifyContent: 'flex-end' },
  title: { color: BAR_INK, fontFamily: fonts.serifMedium, fontSize: 15, flexShrink: 1 },
  pager: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pagerText: { color: BAR_INK, fontSize: 13, fontWeight: '600', minWidth: 44, textAlign: 'center' },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 150,
  },
  voiceTxt: { color: BAR_INK, fontSize: 12, fontWeight: '600' },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PLAY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // livro
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  book: {
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: PAPER,
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
    backgroundColor: PAPER,
  },
  leaf: { left: '50%', right: undefined, transformOrigin: 'left', backfaceVisibility: 'hidden' },
  leafShade: { backgroundColor: '#000', borderRadius: 10 },
  illo: { width: '100%', height: '100%' },
  spine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  // papel
  paper: { flex: 1, backgroundColor: PAPER, paddingHorizontal: 26, paddingTop: 22, paddingBottom: 16 },
  author: {
    color: INK_SOFT,
    fontFamily: fonts.serifMedium,
    fontSize: 11,
    letterSpacing: 2,
    textAlign: 'right',
    marginBottom: 10,
  },
  paperScroll: { flex: 1 },
  paperContent: { flexGrow: 1, justifyContent: 'center' },
  body: { color: INK, fontFamily: fonts.serif, fontSize: 20, lineHeight: 32 },
  dropCap: { color: INK, fontFamily: fonts.serifBold, fontSize: 46, lineHeight: 44 },
  curl: { position: 'absolute', right: 0, bottom: 0 },
});
