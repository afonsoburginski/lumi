import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, Play, Star } from 'lucide-react-native';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { Separator } from '@/components/ui/separator';
import { useColor } from '@/hooks/useColor';
import { useGate } from '@/features/auth/hooks/use-gate';
import { useStory } from '@/lib/hooks/use-story';
import { useAuth } from '@/features/auth/store/auth-store';
import { useCommunity } from '@/features/community/store/community-store';
import { useLibrary } from '@/features/community/store/library-store';
import { gradients, spacing } from '@/theme/tokens';

export default function StoryDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bg = useColor('background');
  const story = useStory(id);

  const { gate } = useGate();
  const user = useAuth((s) => s.user);
  const liked = useCommunity((s) => (id ? s.likedByMe.includes(id) : false));
  const toggleLike = useCommunity((s) => s.toggleLike);
  const addComment = useCommunity((s) => s.addComment);
  const comments = useCommunity((s) => (id ? s.commentsFor(id) : []));
  const rate = useCommunity((s) => s.rate);
  const rating = useCommunity((s) => (id ? s.ratingFor(id) : 0));
  const isFavorite = useLibrary((s) => (id ? s.favorites.includes(id) : false));
  const toggleFavorite = useLibrary((s) => s.toggleFavorite);

  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!story) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Text variant="subtitle">História não encontrada.</Text>
        <Button variant="link" onPress={() => router.back()}>
          Voltar
        </Button>
      </View>
    );
  }

  const submitComment = () => {
    if (!comment.trim()) return;
    gate('comment', () => {
      const res = addComment(
        story.id,
        user?.id ?? 'guest',
        user?.name ?? 'Família',
        comment.trim(),
      );
      if (res.ok) {
        setComment('');
        setError(null);
      } else {
        setError(res.reason);
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <LinearGradient colors={story.coverColors ?? gradients.brand} style={styles.cover}>
          <Button
            size="lg"
            icon={Play}
            onPress={() => gate('read', () => router.push(`/player/${story.id}`))}
          >
            Ler história
          </Button>
        </LinearGradient>

        <RNView style={styles.body}>
          <Text variant="heading">{story.title}</Text>
          <Text variant="caption" style={{ marginTop: spacing.xs }}>
            {story.ageBand} anos{story.authorName ? ` · por ${story.authorName}` : ''}
          </Text>

          <RNView style={styles.actions}>
            <Button
              variant={liked ? 'default' : 'outline'}
              icon={Heart}
              size="sm"
              onPress={() => gate('like', () => toggleLike(story.id))}
            >
              {`${story.likes}`}
            </Button>
            <Button
              variant={isFavorite ? 'default' : 'outline'}
              size="sm"
              onPress={() => gate('favorite', () => toggleFavorite(story.id))}
            >
              {isFavorite ? 'Favoritado' : 'Favoritar'}
            </Button>
          </RNView>

          {/* Avaliação por estrelas */}
          <RNView style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => gate('rate', () => rate(story.id, user?.id ?? 'guest', n))}
                accessibilityRole="button"
                accessibilityLabel={`Avaliar com ${n} estrelas`}
                hitSlop={6}
              >
                <Icon
                  name={Star}
                  size={26}
                  color={n <= Math.round(rating) ? '#FFB84C' : '#C9C4DA'}
                />
              </Pressable>
            ))}
            <Text variant="caption" style={{ marginLeft: spacing.sm }}>
              {rating ? rating.toFixed(1) : 'Avalie'}
            </Text>
          </RNView>

          <Separator style={{ marginVertical: spacing.lg }} />

          <Text variant="subtitle" style={{ marginBottom: spacing.sm }}>
            Comentários
          </Text>
          <Input
            placeholder="Escreva um comentário gentil..."
            value={comment}
            onChangeText={setComment}
            containerStyle={{ marginBottom: spacing.sm }}
          />
          {error ? (
            <Text
              variant="caption"
              lightColor="#FF6B6B"
              darkColor="#FF6B6B"
              style={{ marginBottom: spacing.sm }}
            >
              {error}
            </Text>
          ) : null}
          <Button size="sm" onPress={submitComment} disabled={!comment.trim()}>
            Comentar
          </Button>

          {comments.map((c) => (
            <RNView key={c.id} style={styles.comment}>
              <Text variant="caption" style={{ fontWeight: '800' }}>
                {c.authorName}
              </Text>
              <Text variant="body">{c.text}</Text>
            </RNView>
          ))}
        </RNView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { height: 220, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  stars: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  comment: { marginTop: spacing.md },
});
