import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
        scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
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
        <LinearGradient
          colors={cover}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cover}
        >
          <View style={styles.coverTop}>
            <View style={styles.formatBadge}>
              <Icon name={landscape ? BookOpen : Smartphone} color="#FFFFFF" size={12} />
              <Text
                variant="caption"
                lightColor="#FFFFFF"
                darkColor="#FFFFFF"
                style={styles.badgeText}
              >
                {landscape ? 'Livrinho' : 'Vertical'}
              </Text>
            </View>
            {story.pendingSync ? (
              <View style={styles.pendingBadge}>
                <Icon name={CloudOff} color="#FFFFFF" size={12} />
              </View>
            ) : null}
          </View>

          <View style={styles.playBadge}>
            <Icon name={Play} color="#2B2A4A" size={24} />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text variant="subtitle" numberOfLines={1}>
            {story.title}
          </Text>
          <View style={styles.meta}>
            <Text variant="caption">
              {story.ageBand} anos{story.authorName ? ` · ${story.authorName}` : ''}
            </Text>
            <View style={styles.likes}>
              <Icon name={Heart} size={14} color={Colors.light.pink} />
              <Text variant="caption"> {story.likes}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.light.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  cover: {
    height: 160,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  coverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  pendingBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.pill,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: Colors.light.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    ...shadow.glow,
  },
  body: { padding: spacing.md },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  likes: { flexDirection: 'row', alignItems: 'center' },
});
