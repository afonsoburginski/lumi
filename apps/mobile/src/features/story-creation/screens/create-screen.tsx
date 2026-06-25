import React, { useState } from 'react';
import { Image, StyleSheet, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check, Sparkles, Wand2 } from 'lucide-react-native';

import { Screen } from '@/components/shared/screen';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useColor } from '@/hooks/useColor';
import { useGate } from '@/features/auth/hooks/use-gate';
import { useAuth } from '@/features/auth/store/auth-store';
import { useLibrary } from '@/features/community/store/library-store';
import { useCommunity } from '@/features/community/store/community-store';
import { useVoice } from '@/features/narration-voice/store/voice-store';
import { generateStory } from '@/features/story-creation/services/generation';
import { AGE_BANDS } from '@/lib/age';
import { radius, spacing, type AgeBand } from '@/theme/tokens';
import type { Story, StoryTone } from '@/types/domain';

const TONES: { key: StoryTone; label: string }[] = [
  { key: 'calma', label: '😴 Calma' },
  { key: 'divertida', label: '🤪 Divertida' },
  { key: 'aventura', label: '🦸 Aventura' },
];

type Phase = 'form' | 'generating' | 'preview' | 'blocked';

export default function CreateScreen() {
  const router = useRouter();
  const { gate } = useGate();
  const user = useAuth((s) => s.user);
  const defaultBand = useAuth((s) => s.ageBand);
  const addToLibrary = useLibrary((s) => s.addStory);
  const publishLib = useLibrary((s) => s.publishStory);
  const addToCommunity = useCommunity((s) => s.addStory);
  const voiceId = useVoice((s) => s.selectedVoiceId);
  const safetyBg = useColor('teal');

  const [prompt, setPrompt] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [age, setAge] = useState<AgeBand>(defaultBand);
  const [tone, setTone] = useState<StoryTone>('divertida');
  const [phase, setPhase] = useState<Phase>('form');
  const [story, setStory] = useState<Story | null>(null);
  const [blockMsg, setBlockMsg] = useState('');

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  const generate = () =>
    gate('create', () => {
      setPhase('generating');
      // pequena espera para mostrar a animação mágica
      setTimeout(() => {
        const result = generateStory({
          prompt,
          ageBand: age,
          tone,
          authorId: user?.id ?? 'guest',
          authorName: user?.name,
          imageUri,
          voiceId,
        });
        if (result.ok) {
          setStory(result.story);
          setPhase('preview');
        } else {
          setBlockMsg(result.blocked.reason ?? 'Vamos tentar uma ideia diferente? 🌈');
          setPhase('blocked');
        }
      }, 700);
    });

  const reset = () => {
    setPrompt('');
    setImageUri(undefined);
    setStory(null);
    setPhase('form');
  };

  const save = (publish: boolean) => {
    if (!story) return;
    addToLibrary(story);
    if (publish) {
      publishLib(story.id);
      addToCommunity({ ...story, isPublic: true, moderation: 'approved' });
    }
    reset();
    router.push('/(tabs)/library');
  };

  /* ---------------------- estados ---------------------- */

  if (phase === 'generating') {
    return (
      <Screen title="✨ Criando..." scroll={false}>
        <View style={styles.center}>
          <Spinner />
          <Text variant="subtitle" style={{ marginTop: spacing.lg }}>
            Pintando os cenários...
          </Text>
          <Text variant="caption">Escrevendo o final feliz 🪄</Text>
        </View>
      </Screen>
    );
  }

  if (phase === 'blocked') {
    return (
      <Screen title="🛡️ Ops!" scroll={false}>
        <View style={styles.center}>
          <Text variant="subtitle" style={{ textAlign: 'center' }}>
            {blockMsg}
          </Text>
          <Button onPress={() => setPhase('form')} style={{ marginTop: spacing.lg }}>
            Tentar outra ideia
          </Button>
        </View>
      </Screen>
    );
  }

  if (phase === 'preview' && story) {
    return (
      <Screen title="📖 Prontinho!">
        <Text variant="title">{story.title}</Text>
        <Text variant="caption" style={{ marginBottom: spacing.md }}>
          {story.ageBand} anos · {story.pages.length} páginas
        </Text>
        {story.pages.map((p, i) => (
          <View key={p.id} style={styles.pagePreview}>
            <Text variant="caption" style={{ fontWeight: '800' }}>
              Página {i + 1}
            </Text>
            <Text variant="body">{p.text}</Text>
          </View>
        ))}
        <Button
          icon={Sparkles}
          onPress={() => router.push(`/player/${story.id}`)}
          style={{ marginTop: spacing.md }}
        >
          Ler agora
        </Button>
        <Button
          icon={Check}
          variant="secondary"
          onPress={() => save(false)}
          style={{ marginTop: spacing.sm }}
        >
          Salvar na biblioteca
        </Button>
        <Button onPress={() => save(true)} style={{ marginTop: spacing.sm }}>
          Publicar na comunidade
        </Button>
        <Button variant="link" onPress={reset} style={{ marginTop: spacing.xs }}>
          Descartar
        </Button>
      </Screen>
    );
  }

  /* ---------------------- formulário ---------------------- */
  return (
    <Screen title="✨ Criar História">
      <Text variant="subtitle">Sobre o que é a história?</Text>
      <Input
        multiline
        numberOfLines={3}
        placeholder="Ex.: Um cachorrinho que queria voar..."
        value={prompt}
        onChangeText={setPrompt}
        containerStyle={{ marginVertical: spacing.sm }}
        inputStyle={{ minHeight: 96 }}
      />

      <Button
        variant="outline"
        icon={Camera}
        onPress={pickImage}
        style={{ marginBottom: spacing.sm }}
      >
        {imageUri ? 'Trocar foto do desenho' : 'Adicionar foto de um desenho'}
      </Button>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

      <Text variant="subtitle" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
        Faixa etária
      </Text>
      <RNView style={styles.chips}>
        {AGE_BANDS.map((b) => (
          <Button
            key={b}
            size="sm"
            variant={age === b ? 'default' : 'secondary'}
            onPress={() => setAge(b)}
          >
            {`${b} anos`}
          </Button>
        ))}
      </RNView>

      <Text variant="subtitle" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
        Tom
      </Text>
      <RNView style={styles.chips}>
        {TONES.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tone === t.key ? 'default' : 'secondary'}
            onPress={() => setTone(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </RNView>

      <View style={[styles.safety, { backgroundColor: safetyBg + '22' }]}>
        <Text variant="caption">🛡️ Toda história passa por uma verificação de segurança.</Text>
      </View>

      <Button
        icon={Wand2}
        disabled={prompt.trim().length === 0}
        onPress={generate}
        style={{ marginTop: spacing.lg }}
      >
        Gerar minha história
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  safety: { marginTop: spacing.lg, borderRadius: radius.md, padding: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  preview: { width: '100%', height: 160, borderRadius: radius.md, marginBottom: spacing.sm },
  pagePreview: { marginBottom: spacing.md },
});
