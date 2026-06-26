import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Sparkles, Wand2 } from 'lucide-react-native';

import { Screen } from '@/components/shared/screen';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { StoryCard } from '@/components/shared/story-card';
import { useAuth } from '@/features/auth/store/auth-store';
import { useCommunity } from '@/features/community/store/community-store';
import { useCommunitySync } from '@/features/community/hooks/use-community-sync';
import { useQuota } from '@/features/auth/store/quota-store';
import { gradients, radius, shadow, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const user = useAuth((s) => s.user);
  const ageBand = useAuth((s) => s.ageBand);
  const recommended = useCommunity((s) => s.recommended);
  const search = useCommunity((s) => s.search);
  const remaining = useQuota((s) => s.remaining);

  // Hidrata do servidor quando online + backend; offline usa o cache local.
  useCommunitySync({ ageBand });

  const query = q.trim();
  // Busca vazia → curadoria por faixa etária; com texto → resultados da busca.
  const list = query ? search(q) : recommended(ageBand);
  const greeting = user ? `Olá, ${user.name}! 👋` : '⭐ Olá! Vamos ler?';
  const subtitle = user
    ? 'Pronto pra uma nova história mágica?'
    : `Visitante · ${remaining()} leitura(s) grátis hoje`;

  const goCreate = () => {
    if (process.env.EXPO_OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/create');
  };

  return (
    <Screen title={greeting} subtitle={subtitle}>
      {/* Banner-herói: criar história */}
      <Pressable onPress={goCreate} accessibilityRole="button" accessibilityLabel="Criar história">
        {({ pressed }) => (
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="title" lightColor="#FFFFFF" darkColor="#FFFFFF" style={styles.heroTitle}>
                Criar uma história ✨
              </Text>
              <Text variant="caption" lightColor="#EDE9FF" darkColor="#EDE9FF">
                Conte uma ideia e a mágica acontece
              </Text>
            </View>
            <View style={styles.heroIcon}>
              <Icon name={Wand2} color="#FFFFFF" size={28} />
            </View>
          </LinearGradient>
        )}
      </Pressable>

      <Input
        placeholder="Buscar histórias da comunidade..."
        value={q}
        onChangeText={setQ}
        containerStyle={{ marginBottom: spacing.lg }}
      />

      <View style={styles.sectionRow}>
        <Icon name={Sparkles} color="#FFC44D" size={18} />
        <Text variant="subtitle">
          {query ? `Resultados para “${query}”` : `Para você · ${ageBand} anos`}
        </Text>
      </View>

      {list.map((s) => (
        <StoryCard key={s.id} story={s} />
      ))}
      {list.length === 0 ? (
        <Text variant="caption">
          {query
            ? `Nada encontrado para “${query}”.`
            : 'Nenhuma história disponível offline ainda.'}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  heroTitle: { fontWeight: '800', marginBottom: 2 },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
});
