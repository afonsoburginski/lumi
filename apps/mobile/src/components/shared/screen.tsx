import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { StarryBackdrop } from '@/components/shared/starry-backdrop';
import { useColor } from '@/hooks/useColor';
import { spacing } from '@/theme/tokens';

/** Casca de tela com safe-area, fundo estrelado mágico, título e scroll opcional. */
export function Screen({
  title,
  subtitle,
  scroll = true,
  decorated = true,
  children,
}: {
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  decorated?: boolean;
  children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const bg = useColor('background');

  const header = title ? (
    <View style={styles.header}>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  ) : null;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {decorated ? <StarryBackdrop /> : null}
      <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            {header}
            {children}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { marginTop: spacing.xs },
});
