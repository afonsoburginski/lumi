import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { storyFormat } from '@lumi/shared/types';

import { StoryBookPlayer, StoryPlayer } from '@/features/player';
import { StoryLoader } from '@/components/shared/story-loader';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useStory } from '@/lib/hooks/use-story';
import { mockStory } from '@/lib/mock';

export default function PlayerRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const story = useStory(id) ?? (id === mockStory.id ? mockStory : undefined);

  // Transição mágica ao entrar (cobre também a rotação no formato landscape).
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, []);

  // Trava a orientação conforme o formato da história enquanto o player está em
  // foco; ao sair, volta o app para retrato (baseline do _layout raiz).
  useFocusEffect(
    useCallback(() => {
      const target =
        story && storyFormat(story) === 'landscape'
          ? ScreenOrientation.OrientationLock.LANDSCAPE
          : ScreenOrientation.OrientationLock.PORTRAIT_UP;
      ScreenOrientation.lockAsync(target);
      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
      // só re-trava quando o formato muda (não a cada nova referência de story)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [story?.format]),
  );

  // Offline-first: histórias não baixadas não podem ser lidas sem rede.
  if (story && story.downloaded === false) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#1E1B2E',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
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
      <View
        style={{
          flex: 1,
          backgroundColor: '#1E1B2E',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text variant="subtitle" lightColor="#FFF" darkColor="#FFF">
          História não encontrada.
        </Text>
        <Button variant="secondary" onPress={() => router.back()} style={{ marginTop: 16 }}>
          Voltar
        </Button>
      </View>
    );
  }

  // Transição de entrada (e, na Onda 2, cobre o pré-carregamento do áudio).
  if (!ready) return <StoryLoader title={story.title} />;

  return storyFormat(story) === 'landscape' ? (
    <StoryBookPlayer story={story} onClose={() => router.back()} />
  ) : (
    <StoryPlayer story={story} onClose={() => router.back()} />
  );
}
