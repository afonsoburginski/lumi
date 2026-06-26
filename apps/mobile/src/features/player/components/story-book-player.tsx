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
import { ChevronLeft, ChevronRight, Pause, Play, Volume2 } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';

import { Icon } from '@/components/ui/icon';
import { useVoice } from '@/features/narration-voice/store/voice-store';
import { Colors, withOpacity } from '@/theme/colors';
import { radius, spacing } from '@/theme/tokens';
import type { Story, StoryPage } from '@/types/domain';

import { KaraokeText } from './karaoke-text';
import { RoundButton } from './round-button';
import { HoldToClose } from './hold-to-close';
import { useNarration } from '../hooks/use-narration';

const PAGE_TURN_SOUND = require('../../../../assets/page-turn.wav');

interface Props {
  story: Story;
  initialPage?: number;
  onClose?: () => void;
}

const INK = '#FFFFFF';
const OVERLAY = withOpacity('#1E1B2E', 0.55);
const PAGE_BG = Colors.light.background;
const PAGE_INK = Colors.light.text;
const FLIP_MS = 620;

/**
 * Player LANDSCAPE estilo livrinho. A virada de página é uma animação 3D de
 * folha (rotação na lombada esquerda + sombra + fade) com som de papel — não um
 * slider. Zonas de toque: esquerda/direita viram a página; centro mostra/esconde
 * os controles. Narração premium via useNarration.
 */
export default function StoryBookPlayer({ story, initialPage = 0, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pages = story.pages;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [turn, setTurn] = useState<{ to: number; dir: 1 | -1 } | null>(null);

  const voices = useVoice(useShallow((s) => s.allVoices()));
  const selectedVoiceId = useVoice((s) => s.selectedVoiceId);
  const selectVoice = useVoice((s) => s.select);

  // som de virar a folha
  const turnSound = useAudioPlayer(PAGE_TURN_SOUND);
  const playTurnSound = useCallback(() => {
    try {
      turnSound.seekTo(0);
      turnSound.play();
    } catch {
      // sem áudio do efeito — ignora
    }
  }, [turnSound]);

  // ---- Animação de virar página ----
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

  const { isPlaying, positionMs, durationMs, activeWordIndex, wordTimings, togglePlay, seek } =
    useNarration(pages[currentPage], selectedVoiceId, {
      autoPlay: true,
      onFinished: () => {
        if (currentPage < pages.length - 1) goNext();
      },
    });

  const activeVoice = voices.find((v) => v.id === selectedVoiceId) ?? voices[0];
  const cycleVoice = useCallback(() => {
    const idx = voices.findIndex((v) => v.id === selectedVoiceId);
    const next = voices[(idx + 1) % voices.length];
    if (next) selectVoice(next.id);
  }, [voices, selectedVoiceId, selectVoice]);

  // ---- Chrome auto-hide ----
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showChrome = useCallback(() => {
    setChromeVisible(true);
    Animated.timing(chromeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      Animated.timing(chromeOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(
        () => setChromeVisible(false),
      );
    }, 2500);
  }, [chromeOpacity]);

  const toggleChrome = useCallback(() => {
    if (chromeVisible) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      Animated.timing(chromeOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(
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

  // ---- Zonas de toque: bordas viram página, centro mostra controles ----
  const onTap = useCallback(
    (e: GestureResponderEvent) => {
      const x = e.nativeEvent.locationX;
      if (x < width * 0.26) goPrev();
      else if (x > width * 0.74) goNext();
      else toggleChrome();
    },
    [width, goPrev, goNext, toggleChrome],
  );

  // ---- Folha animada (rotação na lombada esquerda) ----
  const leafStyle = useAnimatedStyle(() => {
    const f = flip.value;
    const deg = dir.value === 1 ? -180 * f : -180 * (1 - f);
    const opacity =
      dir.value === 1
        ? f < 0.5
          ? 1
          : Math.max(0, 1 - (f - 0.5) * 2)
        : f < 0.5
          ? f * 2
          : 1;
    return {
      opacity,
      transform: [{ perspective: 1200 }, { rotateY: `${deg}deg` }],
    };
  });
  const leafShadeStyle = useAnimatedStyle(() => ({ opacity: Math.sin(flip.value * Math.PI) * 0.28 }));

  const hPad = Math.max(insets.left, insets.right, spacing.lg);

  const renderBook = (page: StoryPage, isCurrent: boolean) => (
    <View
      style={[
        styles.pageWrap,
        { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm, paddingHorizontal: hPad },
      ]}
    >
      <View style={styles.bookCard}>
        <View style={styles.illoWrap}>
          <Image source={{ uri: page.imageUri }} style={styles.illo} contentFit="contain" transition={200} />
        </View>
        <View style={styles.textPanel}>
          <ScrollView contentContainerStyle={styles.textPanelContent} showsVerticalScrollIndicator={false}>
            <KaraokeText
              text={page.text}
              words={isCurrent ? wordTimings : page.wordTimings}
              activeIndex={isCurrent ? activeWordIndex : -1}
              textStyle={styles.bookText}
              activeStyle={styles.bookWordActive}
            />
          </ScrollView>
        </View>
      </View>
    </View>
  );

  // bottom = página que fica parada; leaf = folha que gira
  const bottomIndex = turn ? (turn.dir === 1 ? turn.to : currentPage) : currentPage;
  const leafIndex = turn ? (turn.dir === 1 ? currentPage : turn.to) : null;
  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;

  return (
    <View style={styles.root}>
      <Pressable onPress={onTap} style={{ width, height }}>
        {/* camada de baixo (parada) */}
        <View style={StyleSheet.absoluteFill}>{renderBook(pages[bottomIndex], bottomIndex === currentPage)}</View>

        {/* folha girando */}
        {leafIndex !== null ? (
          <Reanimated.View style={[StyleSheet.absoluteFill, styles.leaf, leafStyle]}>
            {renderBook(pages[leafIndex], leafIndex === currentPage)}
            <Reanimated.View style={[StyleSheet.absoluteFill, styles.leafShade, leafShadeStyle]} pointerEvents="none" />
          </Reanimated.View>
        ) : null}
      </Pressable>

      {/* ---- Topo ---- */}
      {chromeVisible && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.topBar, { opacity: chromeOpacity, paddingTop: insets.top + spacing.xs, paddingHorizontal: hPad }]}
        >
          <HoldToClose onClose={onClose} />
          <View style={styles.pageCounter}>
            <RNText style={styles.pageCounterText}>
              {currentPage + 1} / {pages.length}
            </RNText>
          </View>
          <View style={{ width: 44 }} />
        </Animated.View>
      )}

      {/* ---- Inferior ---- */}
      {chromeVisible && (
        <Animated.View
          style={[styles.bottomBar, { opacity: chromeOpacity, paddingBottom: insets.bottom + spacing.sm, paddingHorizontal: hPad }]}
        >
          <Pressable
            style={styles.scrubberTrack}
            onPress={(e) => seek((e.nativeEvent.locationX / (width - hPad * 2)) * durationMs)}
          >
            <View style={[styles.scrubberFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.scrubberThumb, { left: `${progress * 100}%` }]} />
          </Pressable>

          <View style={styles.bottomRow}>
            <View style={styles.dots}>
              {pages.map((p, i) => (
                <View key={p.id} style={[styles.dot, i === currentPage && styles.dotActive]} />
              ))}
            </View>

            <View style={styles.transport}>
              <RoundButton onPress={goPrev} accessibilityLabel="Página anterior">
                <Icon name={ChevronLeft} color={INK} size={22} />
              </RoundButton>
              <RoundButton big onPress={togglePlay} accessibilityLabel={isPlaying ? 'Pausar' : 'Tocar'}>
                <Icon name={isPlaying ? Pause : Play} color={INK} size={24} />
              </RoundButton>
              <RoundButton onPress={goNext} accessibilityLabel="Próxima página">
                <Icon name={ChevronRight} color={INK} size={22} />
              </RoundButton>
            </View>

            <Pressable style={styles.voicePill} onPress={cycleVoice} accessibilityLabel="Trocar voz da narração">
              <Icon name={Volume2} color={INK} size={18} />
              {activeVoice ? <RNText style={styles.voiceLabel}>{activeVoice.label}</RNText> : null}
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark.background },
  pageWrap: { flex: 1 },
  leaf: { transformOrigin: 'left', backfaceVisibility: 'hidden' },
  leafShade: { backgroundColor: '#1E1B2E', borderRadius: radius.lg },
  bookCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: PAGE_BG,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  illoWrap: { flex: 58, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  illo: { width: '100%', height: '100%' },
  textPanel: { flex: 42, borderLeftWidth: 1, borderLeftColor: Colors.light.border },
  textPanelContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  bookText: { color: PAGE_INK, fontSize: 21, lineHeight: 32, fontWeight: '600' },
  bookWordActive: { color: '#1E1B2E', backgroundColor: Colors.light.yellow },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageCounter: {
    backgroundColor: OVERLAY,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pageCounterText: { color: INK, fontWeight: '700', fontSize: 14 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  scrubberTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  scrubberFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: Colors.light.yellow,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: INK,
    marginLeft: -8,
    top: -5,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  voicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: OVERLAY,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 160,
  },
  voiceLabel: { color: INK, fontSize: 12, fontWeight: '600' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 80 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: Colors.light.yellow, width: 22 },
});
