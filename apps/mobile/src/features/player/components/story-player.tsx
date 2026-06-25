import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, X } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { useVoice } from '@/features/narration-voice/store/voice-store';
import { Colors, withOpacity } from '@/theme/colors';
import { radius, spacing } from '@/theme/tokens';
import type { Story, StoryPage } from '@/types/domain';

interface StoryPlayerProps {
  story: Story;
  initialPage?: number;
  onClose?: () => void;
}

// O player é sempre imersivo/escuro, independente do tema do app.
const INK = '#FFFFFF';
const HIGHLIGHT = Colors.light.yellow; // realce karaokê
const OVERLAY = withOpacity('#1E1B2E', 0.55);

/**
 * Player de leitura imersivo (ver docs/specs/mods/player/spec.md).
 * Swipe horizontal, imagem de fundo, texto sobreposto com karaokê e
 * controles de áudio. A reprodução é simulada por um timer; o ponto de
 * integração com áudio real (expo-audio) está isolado no hook `usePlayback`.
 */
export default function StoryPlayer({ story, initialPage = 0, onClose }: StoryPlayerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<StoryPage>>(null);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const { isPlaying, positionMs, durationMs, togglePlay, seek, resetForPage } = usePlayback(
    story.pages[currentPage],
  );

  // Voz da narração (presets + voz clonada da família)
  const voices = useVoice((s) => s.allVoices());
  const selectedVoiceId = useVoice((s) => s.selectedVoiceId);
  const selectVoice = useVoice((s) => s.select);
  const activeVoice = voices.find((v) => v.id === selectedVoiceId) ?? voices[0];
  const cycleVoice = useCallback(() => {
    const idx = voices.findIndex((v) => v.id === selectedVoiceId);
    const next = voices[(idx + 1) % voices.length];
    if (next) selectVoice(next.id);
  }, [voices, selectedVoiceId, selectVoice]);

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
          <LinearGradient
            colors={['transparent', 'rgba(30,27,46,0.15)', 'rgba(30,27,46,0.92)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.textWrap, { paddingBottom: insets.bottom + 140 }]}>
            <KaraokeText
              page={item}
              positionMs={item.id === story.pages[currentPage].id ? positionMs : 0}
            />
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
          <RoundButton onPress={onClose} accessibilityLabel="Fechar leitura">
            <Icon name={X} color={INK} size={22} />
          </RoundButton>
          <View style={styles.pageCounter}>
            <RNText style={styles.pageCounterText}>
              {currentPage + 1} / {story.pages.length}
            </RNText>
          </View>
          <View style={{ width: 56 }} />
        </Animated.View>
      )}

      {/* ---- CHROME: controles inferiores ---- */}
      {chromeVisible && (
        <Animated.View
          style={[styles.bottomBar, { opacity: chromeOpacity, paddingBottom: insets.bottom + spacing.md }]}
        >
          <Pressable
            style={styles.scrubberTrack}
            onPress={(e) => seek((e.nativeEvent.locationX / (width - spacing.lg * 2)) * durationMs)}
          >
            <View style={[styles.scrubberFill, { width: `${progress * 100}%` }]} />
            <View style={[styles.scrubberThumb, { left: `${progress * 100}%` }]} />
          </Pressable>

          <View style={styles.transport}>
            <RoundButton onPress={() => goToPage(currentPage - 1)} accessibilityLabel="Página anterior">
              <Icon name={ChevronLeft} color={INK} size={26} />
            </RoundButton>
            <RoundButton big onPress={togglePlay} accessibilityLabel={isPlaying ? 'Pausar' : 'Tocar'}>
              <Icon name={isPlaying ? Pause : Play} color={INK} size={30} />
            </RoundButton>
            <RoundButton onPress={() => goToPage(currentPage + 1)} accessibilityLabel="Próxima página">
              <Icon name={ChevronRight} color={INK} size={26} />
            </RoundButton>
            <RoundButton onPress={cycleVoice} accessibilityLabel="Trocar voz da narração">
              <Icon name={Volume2} color={INK} size={22} />
            </RoundButton>
          </View>

          {activeVoice ? (
            <RNText style={styles.voiceLabel}>Voz: {activeVoice.label}</RNText>
          ) : null}

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

/* ----------------------- Texto com efeito karaokê ----------------------- */

function KaraokeText({ page, positionMs }: { page: StoryPage; positionMs: number }) {
  const timings = page.wordTimings;

  if (!timings || timings.length === 0) {
    return <RNText style={styles.readingText}>{page.text}</RNText>;
  }

  return (
    <RNText style={styles.readingText}>
      {timings.map((t, i) => {
        const active = positionMs >= t.startMs && positionMs < t.endMs;
        return (
          <RNText key={`${t.word}-${i}`} style={active ? styles.wordActive : undefined}>
            {t.word}
            {i < timings.length - 1 ? ' ' : ''}
          </RNText>
        );
      })}
    </RNText>
  );
}

/* ------------- Hook de reprodução (integração c/ áudio real) ------------ */

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

/* --------------------------- Botão redondo ----------------------------- */

function RoundButton({
  children,
  onPress,
  big,
  accessibilityLabel,
}: {
  children: React.ReactNode;
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
      {children}
    </Pressable>
  );
}

/* ----------------------------------------------------------------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark.background },
  pageImage: { flex: 1, justifyContent: 'flex-end' },
  textWrap: { paddingHorizontal: spacing.lg },
  readingText: {
    color: INK,
    fontSize: 22,
    lineHeight: 33,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  wordActive: { color: '#1E1B2E', backgroundColor: HIGHLIGHT },

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
    backgroundColor: OVERLAY,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  pageCounterText: { color: INK, fontWeight: '700', fontSize: 14 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.lg },
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
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  voiceLabel: { color: INK, textAlign: 'center', fontSize: 12, marginTop: spacing.sm, opacity: 0.9 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: Colors.light.yellow, width: 22 },

  roundBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: OVERLAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnBig: { width: 76, height: 76, backgroundColor: Colors.light.primary },
});
