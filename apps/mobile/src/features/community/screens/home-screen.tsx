import React from 'react';

import { Screen } from '@/components/shared/screen';
import { Text } from '@/components/ui/text';
import { StoryCard } from '@/components/shared/story-card';
import { useAuth } from '@/features/auth/store/auth-store';
import { useCommunity } from '@/features/community/store/community-store';
import { useCommunitySync } from '@/features/community/hooks/use-community-sync';
import { useQuota } from '@/features/auth/store/quota-store';
import { spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const user = useAuth((s) => s.user);
  const ageBand = useAuth((s) => s.ageBand);
  const recommended = useCommunity((s) => s.recommended);
  const remaining = useQuota((s) => s.remaining);

  // Hidrata do servidor quando online + backend; offline usa o cache local.
  useCommunitySync({ ageBand });

  const list = recommended(ageBand);
  const greeting = user ? `Olá, ${user.name}! 👋` : '⭐ Olá! Vamos ler?';

  return (
    <Screen title={greeting}>
      {!user ? (
        <Text variant="caption" style={{ marginBottom: spacing.md }}>
          Visitante · {remaining()} leitura(s) grátis hoje
        </Text>
      ) : null}
      <Text variant="subtitle" style={{ marginBottom: spacing.sm }}>
        Recomendado para {ageBand} anos
      </Text>
      {list.map((s) => (
        <StoryCard key={s.id} story={s} />
      ))}
      {list.length === 0 ? (
        <Text variant="caption">Nenhuma história disponível offline ainda.</Text>
      ) : null}
    </Screen>
  );
}
