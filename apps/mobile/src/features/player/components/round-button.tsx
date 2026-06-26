import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Colors, withOpacity } from '@/theme/colors';
import { radius } from '@/theme/tokens';

const OVERLAY = withOpacity('#1E1B2E', 0.55);

/** Botão circular translúcido usado nos controles dos players. */
export function RoundButton({
  children,
  onPress,
  big,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  big?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.roundBtn,
        big && styles.roundBtnBig,
        pressed && { transform: [{ scale: 0.92 }], opacity: 0.85 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: OVERLAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnBig: { width: 60, height: 60, backgroundColor: Colors.light.primary },
});
