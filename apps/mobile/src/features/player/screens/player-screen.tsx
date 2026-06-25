import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import StoryPlayer from '@/features/player/components/story-player';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useStory } from '@/lib/hooks/use-story';
import { mockStory } from '@/lib/mock';

export default function PlayerRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const story = useStory(id) ?? (id === mockStory.id ? mockStory : undefined);

  // Offline-first: histórias não baixadas não podem ser lidas sem rede.
  if (story && story.downloaded === false) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1E1B2E', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text variant="subtitle" lightColor="#FFF" darkColor="#FFF" style={{ textAlign: 'center' }}>
          Esta história não está disponível offline. Baixe quando tiver internet. ☁️
        </Text>
        <Button variant="secondary" onPress={() => router.back()} style={{ marginTop: 16 }}>
          Voltar
        </Button>
      </View>
    );
  }

  if (!story) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1E1B2E', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text variant="subtitle" lightColor="#FFF" darkColor="#FFF">
          História não encontrada.
        </Text>
        <Button variant="secondary" onPress={() => router.back()} style={{ marginTop: 16 }}>
          Voltar
        </Button>
      </View>
    );
  }

  return <StoryPlayer story={story} onClose={() => router.back()} />;
}
