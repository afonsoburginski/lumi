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
import { useVoice } from '@/features/narration-voice/store/voice-store';
import { fetchNarration } from '@/features/narration-voice/services/narration';
import { config } from '@/config';
import { mockStory } from '@/lib/mock';

const LOADER_MIN_MS = 700; // transição nunca pisca rápido demais
const LOADER_MAX_MS = 6000; // criança não espera: abre mesmo se a voz demorar

export default function PlayerRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const story = useStory(id) ?? (id === mockStory.id ? mockStory : undefined);
  const selectedVoiceId = useVoice((s) => s.selectedVoiceId);

  // O loader existe PRA ISSO: pré-carregar a voz da 1ª página enquanto a
  // transição roda, então quando o player abre a narração já começa na hora.
  // Mesma cacheKey do useNarration → o player encontra o arquivo pronto no cache.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!story) return;
    let cancelled = false;
    let minDone = false;
    let settled = false;
    const finish = () => {
      if (!cancelled && minDone && settled) setReady(true);
    };
    const minT = setTimeout(() => {
      minDone = true;
      finish();
    }, LOADER_MIN_MS);
    const maxT = setTimeout(() => {
      settled = true;
      finish();
    }, LOADER_MAX_MS);

    const page1 = story.pages[0];
    // Só pré-sintetiza se a página NÃO tem áudio empacotado (offline) e há API.
    if (page1 && !page1.audioUri && config.apiUrl) {
      fetchNarration(page1.text, selectedVoiceId, `lazy-${page1.id}-${selectedVoiceId}`)
        .catch(() => {})
        .finally(() => {
          settled = true;
          finish();
        });
    } else {
      settled = true; // offline/mock: nada a pré-carregar
    }

    return () => {
      cancelled = true;
      clearTimeout(minT);
      clearTimeout(maxT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, selectedVoiceId]);

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

  // Loader até a voz da 1ª página estar pré-carregada (ou estourar o tempo máx.).
  if (!ready) return <StoryLoader title={story.title} />;

  return storyFormat(story) === 'landscape' ? (
    <StoryBookPlayer story={story} onClose={() => router.back()} />
  ) : (
    <StoryPlayer story={story} onClose={() => router.back()} />
  );
}
