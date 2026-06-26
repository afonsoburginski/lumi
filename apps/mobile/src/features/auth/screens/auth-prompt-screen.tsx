import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';

import { View as TView } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { StarryBackdrop } from '@/components/shared/starry-backdrop';
import { useColor } from '@/hooks/useColor';
import { shadow, spacing } from '@/theme/tokens';

const MESSAGES: Record<string, string> = {
  create: 'Entre para criar suas próprias histórias mágicas ✨',
  like: 'Entre para curtir as histórias que você ama ❤️',
  comment: 'Entre para deixar um comentário 💬',
  rate: 'Entre para avaliar histórias ⭐',
  favorite: 'Entre para salvar seus favoritos 🔖',
  collection: 'Entre para criar coleções da família 📚',
  clone_voice: 'Entre para gravar a voz da família 🎙️',
};

export default function AuthPromptModal() {
  const router = useRouter();
  const { action } = useLocalSearchParams<{ action?: string }>();
  const bg = useColor('background');
  const tint = useColor('primary');

  const message = (action && MESSAGES[action]) || 'Entre para aproveitar tudo no Lumi.';

  const go = (path: '/(auth)/login' | '/(auth)/signup') => {
    router.back();
    router.push(path);
  };

  return (
    <TView style={[styles.root, { backgroundColor: bg }]}>
      <StarryBackdrop />
      <View style={[styles.icon, { backgroundColor: tint + '22' }]}>
        <Icon name={Sparkles} color={tint} size={36} />
      </View>
      <Text variant="title" style={styles.center}>
        Quase lá!
      </Text>
      <Text variant="caption" style={[styles.center, { marginBottom: spacing.xl }]}>
        {message}
      </Text>
      <Button onPress={() => go('/(auth)/signup')}>Criar conta grátis</Button>
      <Button variant="ghost" onPress={() => go('/(auth)/login')} style={{ marginTop: spacing.sm }}>
        Já tenho conta
      </Button>
      <Button variant="link" onPress={() => router.back()} style={{ marginTop: spacing.xs }}>
        Agora não
      </Button>
    </TView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  center: { textAlign: 'center' },
});
