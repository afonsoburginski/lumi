import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BookOpen, CloudOff, Heart, Play, Smartphone } from 'lucide-react-native';
import { storyFormat } from '@lumi/shared/types';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useGate } from '@/features/auth/hooks/use-gate';
import { gradients, radius, shadow, spacing } from '@/theme/tokens';
import { Colors } from '@/theme/colors';
import type { Story } from '@/types/domain';

interface StoryCardProps {
  story: Story;
  /** Habilita long-press → Alert de confirmação para excluir. Use só na aba "Minhas". */
  onDelete?: () => void;
}

/**
 * Card no estilo Audible: a CAPA do livrinho em destaque (thumbnail retrato com
 * sombra de livro) + título/autor/meta à direita e botão de tocar. A capa real
 * (`coverUri`) é mostrada quando existe; senão, cai no gradiente de marca.
 */
export function StoryCard({ story, onDelete }: StoryCardProps) {
  const router = useRouter();
  const { gate } = useGate();
  const cover = story.coverColors ?? gradients.brand;
  const landscape = storyFormat(story) === 'landscape';

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPress = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    gate('read', () => router.push(`/player/${story.id}`));
  };

  const onLongPress = onDelete
    ? () => {
        if (process.env.EXPO_OS === 'ios')
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
          'Excluir história?',
          `"${story.title}" será removida da sua biblioteca.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: onDelete },
          ],
          { cancelable: true },
        );
      }
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 320 });
      }}
      accessibilityRole="button"
      accessibilityLabel={`Ler ${story.title}`}
      accessibilityHint={onDelete ? 'Toque longo para excluir' : undefined}
      style={{ marginBottom: spacing.md }}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        {/* Capa do livrinho (estante) */}
        <View style={styles.coverWrap}>
          <View style={styles.cover}>
            {story.coverUri ? (
              <Image
                source={{ uri: story.coverUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="top"
                transition={150}
              />
            ) : (
              <LinearGradient
                colors={cover}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            {/* lombada: leve brilho na borda esquerda p/ dar volume de livro */}
            <LinearGradient
              colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.25, y: 0 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>
        </View>

        {/* Infos */}
        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <View style={styles.formatBadge}>
              <Icon name={landscape ? BookOpen : Smartphone} color={Colors.light.tint} size={11} />
              <Text variant="caption" style={styles.badgeText}>
                {landscape ? 'Livrinho' : 'Vertical'}
              </Text>
            </View>
            {story.pendingSync ? <Icon name={CloudOff} color={Colors.light.mutedForeground} size={13} /> : null}
          </View>

          <Text variant="subtitle" numberOfLines={2} style={styles.title}>
            {story.title}
          </Text>
          {story.authorName ? (
            <Text variant="caption" numberOfLines={1} style={styles.author}>
              {story.authorName}
            </Text>
          ) : null}

          <View style={styles.meta}>
            <Text variant="caption" style={styles.metaText}>
              {story.ageBand} anos
            </Text>
            <View style={styles.likes}>
              <Icon name={Heart} size={13} color={Colors.light.pink} />
              <Text variant="caption" style={styles.metaText}> {story.likes}</Text>
            </View>
          </View>
        </View>

        {/* Tocar */}
        <View style={styles.playBadge}>
          <Icon name={Play} color="#2B2A4A" size={22} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const COVER_W = 96;
const COVER_H = 132;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.light.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.md,
    ...shadow.card,
  },
  coverWrap: {
    borderRadius: radius.md,
    ...shadow.soft,
  },
  cover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.light.background,
  },
  body: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 3 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.muted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.light.tint },
  title: { fontWeight: '800', lineHeight: 22 },
  author: { color: Colors.light.mutedForeground },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 2 },
  metaText: { color: Colors.light.mutedForeground },
  likes: { flexDirection: 'row', alignItems: 'center' },
  playBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: Colors.light.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
});
