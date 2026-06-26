import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Colors } from '@/theme/colors';
import { spacing } from '@/theme/tokens';

/** Título de seção com ícone dourado — consistência entre telas. */
export function SectionTitle({
  icon,
  color = Colors.light.yellow,
  children,
}: {
  icon?: React.ComponentType<LucideProps>;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      {icon ? <Icon name={icon} size={18} color={color} /> : null}
      <Text variant="subtitle">{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
});
