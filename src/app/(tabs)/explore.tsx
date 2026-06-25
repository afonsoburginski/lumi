import React, { useState } from 'react';

import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { StoryCard } from '@/components/story/StoryCard';
import { useAuth } from '@/lib/store/authStore';
import { useCommunity } from '@/lib/store/communityStore';
import { useQuota } from '@/lib/store/quotaStore';
import { spacing } from '@/theme/tokens';

export default function ExploreScreen() {
  const [q, setQ] = useState('');
  const search = useCommunity((s) => s.search);
  const user = useAuth((s) => s.user);
  const remaining = useQuota((s) => s.remaining);

  const results = search(q);

  return (
    <Screen title="🔭 Explorar">
      <Input
        placeholder="Buscar histórias da comunidade..."
        value={q}
        onChangeText={setQ}
        containerStyle={{ marginBottom: spacing.md }}
      />
      {!user ? (
        <Text variant="caption" style={{ marginBottom: spacing.md }}>
          Visitante · {remaining()} leitura(s) grátis hoje
        </Text>
      ) : null}
      {results.map((s) => (
        <StoryCard key={s.id} story={s} />
      ))}
      {results.length === 0 ? (
        <Text variant="caption">Nada encontrado para “{q}”.</Text>
      ) : null}
    </Screen>
  );
}
