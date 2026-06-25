import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, gradients, radius, spacing } from '../theme/theme';
import type { Story, StoryPage } from '../types/story';

interface StoryPlayerProps {
  story: Story;
  /** Página inicial (default 0). */
  initialPage?: number;
  onClose?: () => void;
}

/**
 * Player de leitura imersivo (ver docs/SPECS.md §3).
 *
 * - Swipe horizontal entre páginas (FlatList com paging + snap).
 * - Imagem de fundo cobrindo a tela, com gradiente p/ legibilidade.
 * - Texto sobreposto com efeito KARAOKÊ (palavra atual realçada).
 * - Controles de áudio (play/pause, anterior/próxima, scrubber, dots).
 * - Tap na tela mostra/esconde os controles (auto-hide).
 *
 * Observação: a "reprodução" aqui é simulada por um timer que avança a
 * posição em ms, dirigindo o karaokê e o auto-avanço. O ponto de integração
 * com áudio real (expo-audio) está isolado no hook `usePlayback` — basta
 * trocar a fonte do `positionMs`/`durationMs` por eventos do player real.
 */
export default function StoryPlayer({ story, initialPage = 0, onClose }: StoryPlayerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<StoryPage>>(null);

  const [currentPage, setCurrentPage] = useState(initialPage);

  // Posição/duração da narração da página atual (ms).
  const { isPlaying, positionMs, durationMs, togglePlay, seek, resetForPage } = usePlayback(
    story.pages[currentPage],
  );

  // ---- Visibilidade dos controles (chrome) com auto-hide ----
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
    }, 3500);
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

  // ---- Navegação entre páginas ----
  const goToPage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, story.pages.length - 1));
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
    },
    [story.pages.length],
  );

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      if (index !== currentPage) {
        setCurrentPage(index);
        resetForPage(story.pages[index]);
        showChrome();
      }
    },
    [width, currentPage, resetForPage, story.pages, showChrome],
  );

  // Auto-avanço ao terminar o áudio da página.
  useEffect(() => {
    if (durationMs > 0 && positionMs >= durationMs && currentPage < story.pages.length - 1) {
      goToPage(currentPage + 1);
    }
  }, [positionMs, durationMs, currentPage, story.pages.length, goToPage]);

  const renderPage = useCallback(
    ({ item }: { item: StoryPage }) => (
      <Pressable onPress={toggleChrome} style={{ width, height }}>
        <ImageBackground source={{ uri: item.imageUri }} style={styles.pageImage} resizeMode="cover">
          <LinearGradient colors={gradients.readability} style={StyleSheet.absoluteFill} />
          <View style={[styles.textWrap, { paddingBottom: insets.bottom + 140 }]}>
            <KaraokeText page={item} positionMs={item.id === story.pages[currentPage].id ? positionMs : 0} />
          </View>
        </ImageBackground>
      </Pressable>
    ),
    [width, height, toggleChrome, insets.bottom, positionMs, currentPage, story.pages],
  );

  const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={story.pages}
        keyExtractor={(p) => p.id}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialPage}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={onMomentumEnd}
      />

      {/* ---- CHROME: topo (fechar + contador) ---- */}
      {chromeVisible && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.topBar, { opacity: chromeOpacity, paddingTop: insets.top + spacing.sm }]}
        >
          <RoundButton label="✕" onPress={onClose} accessibilityLabel="Fechar leitura" />
          <View style={styles.pageCounter}>
            <Text style={styles.pageCounterText}>
              {currentPage + 1} / {story.pages.length}
            </Text>
          </View>
          <View style={{ width: 48 }} />
        </Animated.View>
      )}

      {/* ---- CHROME: controles inferiores ---- */}
      {chromeVisible && (
        <Animated.View
          style={[styles.bottomBar, { opacity: chromeOpacity, paddingBottom: insets.bottom + spacing.md }]}
        >
          {/* Scrubber de progresso da narração */}
          <Pressable
            style={styles.scrubberTrack}
            onPress={(e) => seek((e.nativeEvent.locationX / (width - spacing.lg * 2)) * durationMs)}
          >
            <View style={[styles.scrubberFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.scrubberThumb, { left: `${progress * 100}%` }]} />
          </Pressable>

          {/* Controles de transporte */}
          <View style={styles.transport}>
            <RoundButton label="◀◀" onPress={() => goToPage(currentPage - 1)} accessibilityLabel="Página anterior" />
            <RoundButton
              label={isPlaying ? '⏸' : '▶'}
              big
              onPress={togglePlay}
              accessibilityLabel={isPlaying ? 'Pausar narração' : 'Tocar narração'}
            />
            <RoundButton label="▶▶" onPress={() => goToPage(currentPage + 1)} accessibilityLabel="Próxima página" />
          </View>

          {/* Dots de páginas */}
          <View style={styles.dots}>
            {story.pages.map((p, i) => (
              <View key={p.id} style={[styles.dot, i === currentPage && styles.dotActive]} />
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Texto com efeito karaokê                                            */
/* ------------------------------------------------------------------ */

function KaraokeText({ page, positionMs }: { page: StoryPage; positionMs: number }) {
  const timings = page.wordTimings;

  // Sem timings: renderiza o texto simples (fallback).
  if (!timings || timings.length === 0) {
    return <Text style={styles.readingText}>{page.text}</Text>;
  }

  return (
    <Text style={styles.readingText}>
      {timings.map((t, i) => {
        const active = positionMs >= t.startMs && positionMs < t.endMs;
        return (
          <Text key={`${t.word}-${i}`} style={active ? styles.wordActive : undefined}>
            {t.word}
            {i < timings.length - 1 ? ' ' : ''}
          </Text>
        );
      })}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/* Hook de "reprodução" (ponto de integração com áudio real)           */
/* ------------------------------------------------------------------ */

function usePlayback(page: StoryPage) {
  const durationMs = useMemo(() => {
    const last = page.wordTimings?.[page.wordTimings.length - 1];
    return last ? last.endMs : 6000;
  }, [page]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [positionMs, setPositionMs] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTick = useCallback(() => {
    if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      stopTick();
      return;
    }
    const STEP = 50;
    tick.current = setInterval(() => {
      setPositionMs((prev) => {
        const next = prev + STEP;
        if (next >= durationMs) {
          stopTick();
          return durationMs;
        }
        return next;
      });
    }, STEP);
    return stopTick;
  }, [isPlaying, durationMs, stopTick]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => {
      // Se terminou, dar play recomeça do início.
      if (!p && positionMs >= durationMs) setPositionMs(0);
      return !p;
    });
  }, [positionMs, durationMs]);

  const seek = useCallback(
    (ms: number) => setPositionMs(Math.max(0, Math.min(ms, durationMs))),
    [durationMs],
  );

  const resetForPage = useCallback((_next: StoryPage) => {
    setPositionMs(0);
    setIsPlaying(true);
  }, []);

  return { isPlaying, positionMs, durationMs, togglePlay, seek, resetForPage };
}

/* ------------------------------------------------------------------ */
/* Botão redondo de controle                                           */
/* ------------------------------------------------------------------ */

function RoundButton({
  label,
  onPress,
  big,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  big?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.roundBtn,
        big && styles.roundBtnBig,
        pressed && { transform: [{ scale: 0.92 }], opacity: 0.85 },
      ]}
    >
      <Text style={[styles.roundBtnLabel, big && styles.roundBtnLabelBig]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDark },
  pageImage: { flex: 1, justifyContent: 'flex-end' },
  textWrap: { paddingHorizontal: spacing.lg },
  readingText: {
    color: colors.textOnDark,
    fontSize: fontSize.reading,
    lineHeight: fontSize.reading * 1.5,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  wordActive: {
    color: colors.bgDark,
    backgroundColor: colors.karaokeHighlight,
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  pageCounter: {
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pageCounterText: { color: colors.textOnDark, fontWeight: '700', fontSize: fontSize.caption },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  scrubberTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  scrubberFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
  },
  scrubberThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginLeft: -8,
    top: -5,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: colors.secondary, width: 22 },

  roundBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnBig: { width: 76, height: 76, backgroundColor: colors.primary },
  roundBtnLabel: { color: colors.textOnDark, fontSize: 18, fontWeight: '800' },
  roundBtnLabelBig: { fontSize: 30 },
});
