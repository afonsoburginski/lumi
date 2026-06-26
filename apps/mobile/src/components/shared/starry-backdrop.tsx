import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { useColorScheme } from '@/hooks/useColorScheme';

/** Caminho de uma estrelinha de 5 pontas (viewBox 0 0 24 24). */
const STAR =
  'M12 .6l3.7 7.4 8.2 1.2-5.9 5.8 1.4 8.2L12 18.9l-7.4 3.9 1.4-8.2L.1 9.2l8.2-1.2z';

type Spark = { x: number; y: number; size: number; tone: 'gold' | 'white'; opacity: number };

// Posições em % da tela (estáveis — sem random p/ não "pular" entre renders).
const SPARKS: Spark[] = [
  { x: 12, y: 10, size: 16, tone: 'gold', opacity: 0.9 },
  { x: 86, y: 8, size: 11, tone: 'white', opacity: 0.7 },
  { x: 70, y: 16, size: 8, tone: 'gold', opacity: 0.6 },
  { x: 24, y: 22, size: 7, tone: 'white', opacity: 0.5 },
  { x: 92, y: 30, size: 13, tone: 'gold', opacity: 0.55 },
  { x: 6, y: 40, size: 9, tone: 'white', opacity: 0.45 },
  { x: 50, y: 6, size: 9, tone: 'gold', opacity: 0.5 },
  { x: 80, y: 52, size: 7, tone: 'white', opacity: 0.4 },
];

/**
 * Camada decorativa de fundo (não-interativa): brilhos suaves + estrelinhas
 * douradas, ecoando a logo. Sutil no modo claro, mais luminosa à noite.
 */
export function StarryBackdrop() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const gold = dark ? '#FFD66B' : '#FFC44D';
  const white = dark ? '#FFFFFF' : '#9FC0FF';
  const glowOpacity = dark ? 0.5 : 0.35;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glowGold" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={gold} stopOpacity={glowOpacity} />
            <Stop offset="100%" stopColor={gold} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowSky" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={dark ? '#6C5CE7' : '#9FC0FF'} stopOpacity={glowOpacity} />
            <Stop offset="100%" stopColor={dark ? '#6C5CE7' : '#9FC0FF'} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* brilhos suaves (cantos) */}
        <Circle cx="12%" cy="6%" r="120" fill="url(#glowGold)" />
        <Circle cx="92%" cy="20%" r="150" fill="url(#glowSky)" />
        <Circle cx="80%" cy="86%" r="130" fill="url(#glowGold)" />
      </Svg>

      {SPARKS.map((s, i) => (
        <Svg
          key={i}
          width={s.size}
          height={s.size}
          viewBox="0 0 24 24"
          style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, opacity: s.opacity }}
        >
          <Path d={STAR} fill={s.tone === 'gold' ? gold : white} />
        </Svg>
      ))}
    </View>
  );
}
