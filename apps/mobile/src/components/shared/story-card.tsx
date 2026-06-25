import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CloudOff, Heart, Play } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';
import { useGate } from '@/features/auth/hooks/use-gate';
import { useLibrary } from '@/features/community/store/library-store';
import { gradients, radius, spacing } from '@/theme/tokens';
import type { Story } from '@/types/domain';

export function StoryCard({ story }: { story: Story }) {
  const router = useRouter();
  const { gate } = useGate();
  const isFavorite = useLibrary((s) => s.favorites.includes(story.id));

  const cover = story.coverColors ?? gradients.brand;

  return (
    <Pressable
      onPress={() => gate('read', () => router.push(`/player/${story.id}`))}
      accessibilityRole="button"
      accessibilityLabel={`Ler ${story.title}`}
      style={{ marginBottom: spacing.md }}
    >
      <Card style={styles.card}>
        <LinearGradient colors={cover} style={styles.cover}>
          {story.pendingSync ? (
            <View style={styles.pendingBadge}>
              <Icon name={CloudOff} color="#FFFFFF" size={12} />
              <Text variant="caption" lightColor="#FFFFFF" darkColor="#FFFFFF">
                {' '}
                pendente
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.playBadge}>
            <Icon name={Play} color="#FFFFFF" size={22} />
          </View>
        </LinearGradient>
        <CardContent style={{ paddingVertical: spacing.md }}>
          <Text variant="subtitle" numberOfLines={1}>
            {story.title}
          </Text>
          <View style={styles.meta}>
            <Text variant="caption">
              {story.ageBand} anos{story.authorName ? ` · ${story.authorName}` : ''}
            </Text>
            <View style={styles.likes}>
              <Icon name={Heart} size={14} color="#FF7AA2" />
              <Text variant="caption"> {story.likes}</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: radius.lg },
  cover: {
    height: 150,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    height: 24,
    alignSelf: 'flex-start',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  likes: { flexDirection: 'row', alignItems: 'center' },
});
