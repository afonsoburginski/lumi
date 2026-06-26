import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { Colors } from '@/theme/colors';
import { radius, shadow, spacing } from '@/theme/tokens';

const STAR =
  'M12 .6l3.7 7.4 8.2 1.2-5.9 5.8 1.4 8.2L12 18.9l-7.4 3.9 1.4-8.2L.1 9.2l8.2-1.2z';

/** Estado vazio amigável: estrelinha dourada + mensagem. */
export function EmptyState({ title, message }: { title?: string; message: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.star}>
        <Svg width={40} height={40} viewBox="0 0 24 24">
          <Path d={STAR} fill={Colors.light.yellow} />
        </Svg>
      </View>
      {title ? (
        <Text variant="subtitle" style={styles.title}>
          {title}
        </Text>
      ) : null}
      <Text variant="caption" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  star: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  title: { marginTop: spacing.md },
  message: { textAlign: 'center', marginTop: spacing.xs },
});
