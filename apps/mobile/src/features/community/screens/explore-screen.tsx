import React, { useState } from 'react';

import { Screen } from '@/components/shared/screen';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { StoryCard } from '@/components/shared/story-card';
import { useAuth } from '@/features/auth/store/auth-store';
import { useCommunity } from '@/features/community/store/community-store';
import { useQuota } from '@/features/auth/store/quota-store';
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
      {results.length === 0 ? <Text variant="caption">Nada encontrado para “{q}”.</Text> : null}
    </Screen>
  );
}
