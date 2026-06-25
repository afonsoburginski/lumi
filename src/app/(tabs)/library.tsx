import React, { useState } from 'react';
import { View as RNView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FolderPlus } from 'lucide-react-native';

import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { StoryCard } from '@/components/story/StoryCard';
import { useGate } from '@/lib/hooks/useGate';
import { useAuth } from '@/lib/store/authStore';
import { useLibrary } from '@/lib/store/libraryStore';
import { useCommunity } from '@/lib/store/communityStore';
import { spacing } from '@/theme/tokens';

type Tab = 'stories' | 'favorites' | 'collections';

export default function LibraryScreen() {
  const router = useRouter();
  const { gate } = useGate();
  const user = useAuth((s) => s.user);
  const myStories = useLibrary((s) => s.myStories);
  const favorites = useLibrary((s) => s.favorites);
  const collections = useLibrary((s) => s.collections);
  const createCollection = useLibrary((s) => s.createCollection);
  const community = useCommunity((s) => s.stories);

  const [tab, setTab] = useState<Tab>('stories');
  const [newCol, setNewCol] = useState('');

  const favStories = [...community, ...myStories].filter((s) => favorites.includes(s.id));

  return (
    <Screen title="📚 Minha Biblioteca">
      <RNView style={styles.tabs}>
        <Button size="sm" variant={tab === 'stories' ? 'default' : 'secondary'} onPress={() => setTab('stories')}>
          Minhas
        </Button>
        <Button size="sm" variant={tab === 'favorites' ? 'default' : 'secondary'} onPress={() => setTab('favorites')}>
          Favoritos
        </Button>
        <Button size="sm" variant={tab === 'collections' ? 'default' : 'secondary'} onPress={() => setTab('collections')}>
          Coleções
        </Button>
      </RNView>

      {tab === 'stories' &&
        (myStories.length ? (
          myStories.map((s) => <StoryCard key={s.id} story={s} />)
        ) : (
          <Text variant="caption">Você ainda não criou histórias. Toque em ✨ Criar!</Text>
        ))}

      {tab === 'favorites' &&
        (favStories.length ? (
          favStories.map((s) => <StoryCard key={s.id} story={s} />)
        ) : (
          <Text variant="caption">Nenhum favorito ainda. Toque no ❤️ de uma história.</Text>
        ))}

      {tab === 'collections' && (
        <>
          <RNView style={styles.newCol}>
            <Input
              placeholder="Nome da coleção (ex.: Hora de dormir)"
              value={newCol}
              onChangeText={setNewCol}
              containerStyle={{ flex: 1 }}
            />
            <Button
              icon={FolderPlus}
              onPress={() =>
                gate('collection', () => {
                  if (newCol.trim()) {
                    createCollection(user?.id ?? 'guest', newCol.trim());
                    setNewCol('');
                  }
                })
              }
            >
              Criar
            </Button>
          </RNView>
          {collections.length ? (
            collections.map((c) => (
              <Card key={c.id} style={{ marginBottom: spacing.sm }}>
                <CardContent style={{ paddingVertical: spacing.md }}>
                  <Button variant="ghost" onPress={() => router.push(`/collection/${c.id}`)}>
                    {`${c.visibility === 'public' ? '🌍' : '🔒'} ${c.title} (${c.storyIds.length})`}
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Text variant="caption">Crie coleções para organizar as histórias da família.</Text>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  newCol: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
});
