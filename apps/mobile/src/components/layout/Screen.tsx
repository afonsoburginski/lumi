import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { spacing } from '@/theme/tokens';

/** Casca de tela com safe-area, título e scroll opcional. */
export function Screen({
  title,
  scroll = true,
  children,
}: {
  title?: string;
  scroll?: boolean;
  children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const bg = useColor('background');
  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top + spacing.md }]}>
      {title ? (
        <Text variant="heading" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg },
  title: { marginBottom: spacing.md },
});
