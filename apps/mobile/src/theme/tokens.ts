/**
 * Tokens extras do Lumi que complementam o `@/theme/globals` da BNA UI
 * (que define só HEIGHT, FONT_SIZE, BORDER_RADIUS, CORNERS).
 * Cores ficam em `@/theme/colors`.
 */
import { Colors } from '@/theme/colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

export const fontSize = {
  caption: 14,
  body: 18, // leitura grande por padrão
  reading: 22,
  title: 28,
  display: 36,
} as const;

/** Gradientes da marca (usados em capas, CTAs e overlay de leitura). */
export const gradients = {
  brand: [Colors.light.primary, '#A29BFE'] as const,
  playful: ['#FFB84C', '#FF7AA2'] as const,
  readability: ['transparent', 'rgba(30,27,46,0.15)', 'rgba(30,27,46,0.92)'] as const,
} as const;

export type AgeBand = '3-5' | '6-8' | '9-12';
