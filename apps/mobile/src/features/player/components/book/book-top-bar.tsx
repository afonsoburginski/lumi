import React from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, X } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { spacing } from '@/theme/tokens';
import { fonts } from '@/theme/fonts';

import { BOOK, barTotalHeight } from './constants';

export interface BookTopBarProps {
  title: string;
  page: number; // 0-based
  total: number;
  isPlaying: boolean;
  voiceLabel?: string;
  paddingHorizontal: number;
  onClose?: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onCycleVoice: () => void;
}

/**
 * Barra superior do livrinho — FIXA (modo bloqueio infantil): única forma de sair
 * (X) e de navegar manualmente (setas). Toques na página não fazem nada.
 */
export function BookTopBar({
  title,
  page,
  total,
  isPlaying,
  voiceLabel,
  paddingHorizontal,
  onClose,
  onPrev,
  onNext,
  onTogglePlay,
  onCycleVoice,
}: BookTopBarProps) {
  const insets = useSafeAreaInsets();
  const topPad = Math.min(insets.top, 6);

  return (
    <View style={[styles.bar, { height: barTotalHeight(insets.top), paddingTop: topPad, paddingHorizontal }]}>
      <View style={styles.side}>
        <Pressable onPress={onClose} hitSlop={10} style={styles.ghostBtn} accessibilityLabel="Fechar história">
          <Icon name={X} color={BOOK.barInk} size={18} />
        </Pressable>
        <RNText style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </RNText>
      </View>

      <View style={styles.pager}>
        <Pressable onPress={onPrev} hitSlop={10} style={styles.ghostBtn} accessibilityLabel="Página anterior">
          <Icon name={ChevronLeft} color={page > 0 ? BOOK.barInk : BOOK.barMuted} size={20} />
        </Pressable>
        <RNText style={styles.pagerText} numberOfLines={1}>
          {page + 1}/{total}
        </RNText>
        <Pressable onPress={onNext} hitSlop={10} style={styles.ghostBtn} accessibilityLabel="Próxima página">
          <Icon name={ChevronRight} color={page < total - 1 ? BOOK.barInk : BOOK.barMuted} size={20} />
        </Pressable>
      </View>

      <View style={[styles.side, styles.right]}>
        <Pressable onPress={onCycleVoice} style={styles.voicePill} accessibilityLabel="Trocar voz">
          <Icon name={Volume2} color={BOOK.barInk} size={16} />
          {voiceLabel ? (
            <RNText style={styles.voiceTxt} numberOfLines={1} ellipsizeMode="tail">
              {voiceLabel}
            </RNText>
          ) : null}
        </Pressable>
        <Pressable
          onPress={onTogglePlay}
          style={styles.playBtn}
          accessibilityLabel={isPlaying ? 'Pausar narração' : 'Ouvir narração'}
        >
          <Icon name={isPlaying ? Pause : Play} color="#FFFFFF" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BOOK.barBg,
    gap: spacing.sm,
  },
  side: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 },
  right: { justifyContent: 'flex-end' },
  ghostBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  title: { color: BOOK.barInk, fontFamily: fonts.serifMedium, fontSize: 15, flexShrink: 1 },
  pager: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pagerText: { color: BOOK.barInk, fontSize: 13, fontWeight: '600', minWidth: 40, textAlign: 'center' },
  voicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 150,
  },
  voiceTxt: { color: BOOK.barInk, fontSize: 12, fontWeight: '600' },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BOOK.playBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
