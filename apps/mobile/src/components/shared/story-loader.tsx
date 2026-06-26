import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { StarryBackdrop } from '@/components/shared/starry-backdrop';
import { gradients, spacing } from '@/theme/tokens';

const STAR =
  'M12 .6l3.7 7.4 8.2 1.2-5.9 5.8 1.4 8.2L12 18.9l-7.4 3.9 1.4-8.2L.1 9.2l8.2-1.2z';

/** Transição mágica ao entrar numa história: estrela pulsante sobre céu noturno. */
export function StoryLoader({ title }: { title?: string }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.9 + pulse.value * 0.25 }],
    opacity: 0.75 + pulse.value * 0.25,
  }));

  return (
    <LinearGradient colors={gradients.night} style={styles.root}>
      <StarryBackdrop />
      <Animated.View style={[styles.star, starStyle]}>
        <Svg width={84} height={84} viewBox="0 0 24 24">
          <Path d={STAR} fill="#FFD66B" />
        </Svg>
      </Animated.View>
      <Text variant="subtitle" lightColor="#FFFFFF" darkColor="#FFFFFF" style={styles.text}>
        Abrindo a história…
      </Text>
      {title ? (
        <Text variant="caption" lightColor="#C9C3F0" darkColor="#C9C3F0" style={styles.title}>
          {title}
        </Text>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  star: {
    shadowColor: '#FFD66B',
    shadowOpacity: 0.7,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  text: { marginTop: spacing.lg, fontWeight: '700' },
  title: { marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.xl },
});
