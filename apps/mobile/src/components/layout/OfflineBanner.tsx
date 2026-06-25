import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloudOff } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useConnectivity } from '@/lib/net/connectivity';
import { useSync } from '@/lib/services/sync';
import { spacing } from '@/theme/tokens';

/** Banner global de modo offline + contador de pendências (offline-first). */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivity((s) => s.isOnline);
  const pending = useSync((s) => s.outbox.length);

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]}>
      <Icon name={CloudOff} color="#FFFFFF" size={16} />
      <Text variant="caption" lightColor="#FFFFFF" darkColor="#FFFFFF" style={styles.text}>
        Você está offline{pending > 0 ? ` · ${pending} ação(ões) pendente(s)` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: 6,
    backgroundColor: '#7A7690',
  },
  text: { fontWeight: '600' },
});
