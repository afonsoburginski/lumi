import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StoryCard } from '@/components/story/StoryCard';
import { useColor } from '@/hooks/useColor';
import { useLibrary } from '@/lib/store/libraryStore';
import { useCommunity } from '@/lib/store/communityStore';
import { spacing } from '@/theme/tokens';

export default function CollectionDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bg = useColor('background');

  const collection = useLibrary((s) => s.collections.find((c) => c.id === id));
  const community = useCommunity((s) => s.stories);
  const mine = useLibrary((s) => s.myStories);

  if (!collection) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Text variant="subtitle">Coleção não encontrada.</Text>
        <Button variant="link" onPress={() => router.back()}>
          Voltar
        </Button>
      </View>
    );
  }

  const all = [...community, ...mine];
  const stories = collection.storyIds
    .map((sid) => all.find((s) => s.id === sid))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top + spacing.md }]}>
      <Text variant="heading">{collection.title}</Text>
      <Badge variant={collection.visibility === 'public' ? 'default' : 'secondary'} style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}>
        {collection.visibility === 'public' ? 'Pública' : 'Privada (família)'}
      </Badge>
      <ScrollView style={{ marginTop: spacing.md }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {stories.length === 0 ? (
          <Text variant="caption">Nenhuma história nesta coleção ainda.</Text>
        ) : (
          stories.map((s) => <StoryCard key={s.id} story={s} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
