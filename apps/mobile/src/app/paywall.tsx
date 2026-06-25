import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Moon } from 'lucide-react-native';

import { View as TView } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useColor } from '@/hooks/useColor';
import { GUEST_DAILY_LIMIT } from '@/lib/store/quotaStore';
import { spacing } from '@/theme/tokens';

export default function PaywallModal() {
  const router = useRouter();
  const bg = useColor('background');
  const tint = useColor('primary');

  const go = () => {
    router.back();
    router.push('/(auth)/signup');
  };

  return (
    <TView style={[styles.root, { backgroundColor: bg }]}>
      <View style={[styles.icon, { backgroundColor: tint + '22' }]}>
        <Icon name={Moon} color={tint} size={36} />
      </View>
      <Text variant="title" style={styles.center}>
        Hora de descansar os olhos 🌙
      </Text>
      <Text variant="caption" style={[styles.center, { marginBottom: spacing.xl }]}>
        Você usou suas {GUEST_DAILY_LIMIT} leituras de hoje como visitante. Crie uma conta grátis
        para ler sem limites — e criar suas próprias histórias!
      </Text>
      <Button onPress={go}>Criar conta grátis</Button>
      <Button variant="link" onPress={() => router.back()} style={{ marginTop: spacing.sm }}>
        Voltar amanhã
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
  },
  center: { textAlign: 'center' },
});
