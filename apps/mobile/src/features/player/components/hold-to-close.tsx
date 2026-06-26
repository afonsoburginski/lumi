import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { X } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { Colors, withOpacity } from '@/theme/colors';
import { radius } from '@/theme/tokens';

const HOLD_MS = 1300;
const OVERLAY = withOpacity('#1E1B2E', 0.55);

/**
 * Trava anti-toque: fechar a história exige **segurar** ~1,3s (a criança não
 * fecha sem querer). Um anel dourado preenche enquanto segura; soltar cancela.
 */
export function HoldToClose({ onClose }: { onClose?: () => void }) {
  const fill = useSharedValue(0);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + fill.value * 0.6 }],
    opacity: fill.value,
  }));

  return (
    <Pressable
      onPressIn={() => {
        fill.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
      }}
      onPressOut={() => {
        fill.value = withTiming(0, { duration: 180 });
      }}
      onLongPress={onClose}
      delayLongPress={HOLD_MS}
      accessibilityRole="button"
      accessibilityLabel="Segure para fechar a história"
      style={styles.btn}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
      <Icon name={X} color="#FFFFFF" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: OVERLAY,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
    backgroundColor: Colors.light.yellow,
  },
});
