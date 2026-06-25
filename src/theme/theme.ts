/**
 * Design tokens do Lumi.
 * Paleta vibrante porém confortável para leitura (ver docs/SPECS.md §1).
 */

export const colors = {
  primary: '#6C5CE7', // roxo mágico
  primaryLight: '#A29BFE',
  secondary: '#FFB84C', // amarelo-estrela
  accentPink: '#FF7AA2',
  accentTeal: '#4ECDC4',

  bgLight: '#FFF9F0', // creme (não branco puro)
  bgDark: '#1E1B2E', // roxo-noite (modo leitura)
  surface: '#FFFFFF',

  textPrimary: '#2D2A40',
  textSecondary: '#7A7690',
  textOnDark: '#FFFFFF',

  karaokeHighlight: '#FFD93D', // realce da palavra narrada
  danger: '#FF6B6B',

  overlay: 'rgba(30, 27, 46, 0.55)',
} as const;

export const gradients = {
  brand: ['#6C5CE7', '#A29BFE'] as const,
  playful: ['#FFB84C', '#FF7AA2'] as const,
  // Gradiente escuro de baixo p/ cima, para dar legibilidade ao texto sobre a imagem.
  readability: ['transparent', 'rgba(30,27,46,0.15)', 'rgba(30,27,46,0.9)'] as const,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  caption: 14,
  body: 18, // leitura grande por padrão
  reading: 22,
  title: 28,
  display: 36,
} as const;

export type AgeBand = '3-5' | '6-8' | '9-12';
