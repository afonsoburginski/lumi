import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { ChevronLeft, ChevronRight, Pause, Play, Volume2 } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';

import { Icon } from '@/components/ui/icon';
import { useVoice } from '@/features/narration-voice/store/voice-store';
import { Colors, withOpacity } from '@/theme/colors';
import { radius, spacing } from '@/theme/tokens';
import type { Story, StoryPage } from '@/types/domain';

import { HoldToClose } from './hold-to-close';

import { KaraokeText } from './karaoke-text';
import { RoundButton } from './round-button';
import { useNarration } from '../hooks/use-narration';

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
 * Player de leitura imersivo VERTICAL (formato 'portrait'). Swipe horizontal,
 * imagem de fundo full-bleed, texto sobreposto com karaokê e controles de
 * áudio. Narração real via TTS on-device (hook `useNarration`).
 */
export default function StoryPlayer({ story, initialPage = 0, onClose }: StoryPlayerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<StoryPage>>(null);

  const [currentPage, setCurrentPage] = useState(initialPage);

  // Voz da narração (presets + voz clonada da família)
  const voices = useVoice(useShallow((s) => s.allVoices()));
  const selectedVoiceId = useVoice((s) => s.selectedVoiceId);
  const selectVoice = useVoice((s) => s.select);

  // ---- Navegação entre páginas ----
  const goToPage = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, story.pages.length - 1));
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
    },
    [story.pages.length],
  );

  const { isPlaying, positionMs, durationMs, activeWordIndex, wordTimings, togglePlay, seek } =
    useNarration(story.pages[currentPage], selectedVoiceId, {
      autoPlay: true,
      onFinished: () => {
        if (currentPage < story.pages.length - 1) goToPage(currentPage + 1);
      },
    });

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

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      if (index !== currentPage) {
        setCurrentPage(index);
        showChrome();
      }
    },
    [width, currentPage, showChrome],
  );

  const currentId = story.pages[currentPage].id;
  const renderPage = useCallback(
    ({ item }: { item: StoryPage }) => {
      const isCurrent = item.id === currentId;
      return (
        <Pressable onPress={toggleChrome} style={{ width, height }}>
          <ImageBackground source={{ uri: item.imageUri }} style={styles.pageImage} resizeMode="cover">
            <LinearGradient
              colors={['transparent', 'rgba(30,27,46,0.15)', 'rgba(30,27,46,0.92)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.textWrap, { paddingBottom: insets.bottom + 140 }]}>
              <KaraokeText
                text={item.text}
                words={isCurrent ? wordTimings : item.wordTimings}
                activeIndex={isCurrent ? activeWordIndex : -1}
                textStyle={styles.readingText}
                activeStyle={styles.wordActive}
              />
            </View>
          </ImageBackground>
        </Pressable>
      );
    },
    [width, height, toggleChrome, insets.bottom, wordTimings, activeWordIndex, currentId],
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
          <HoldToClose onClose={onClose} />
          <View style={styles.pageCounter}>
            <RNText style={styles.pageCounterText}>
              {currentPage + 1} / {story.pages.length}
            </RNText>
          </View>
          <View style={{ width: 44 }} />
        </Animated.View>
      )}

      {/* ---- CHROME: controles inferiores ---- */}
      {chromeVisible && (
        <Animated.View
          style={[
            styles.bottomBar,
            { opacity: chromeOpacity, paddingBottom: insets.bottom + spacing.md },
          ]}
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
              <Icon name={isPlaying ? Pause : Play} color={INK} size={24} />
            </RoundButton>
            <RoundButton onPress={() => goToPage(currentPage + 1)} accessibilityLabel="Próxima página">
              <Icon name={ChevronRight} color={INK} size={26} />
            </RoundButton>
            <RoundButton onPress={cycleVoice} accessibilityLabel="Trocar voz da narração">
              <Icon name={Volume2} color={INK} size={22} />
            </RoundButton>
          </View>

          {activeVoice ? <RNText style={styles.voiceLabel}>Voz: {activeVoice.label}</RNText> : null}

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
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  voiceLabel: {
    color: INK,
    textAlign: 'center',
    fontSize: 12,
    marginTop: spacing.sm,
    opacity: 0.9,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: Colors.light.yellow, width: 22 },
});
