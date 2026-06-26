/**
 * Tokens extras do Lumi que complementam o `@/theme/globals` da BNA UI
 * (que define só HEIGHT, FONT_SIZE, BORDER_RADIUS, CORNERS).
 * Cores ficam em `@/theme/colors`.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 36,
  pill: 999,
} as const;

export const fontSize = {
  caption: 14,
  body: 18, // leitura grande por padrão
  reading: 22,
  title: 28,
  display: 36,
} as const;

/** Gradientes da marca — derivados da logo (céu, estrela, livro, noite). */
export const gradients = {
  brand: ['#8E7BFF', '#6C5CE7'] as const, // índigo mágico (CTAs)
  sky: ['#AFD3FF', '#6FA8F5'] as const, // céu de dia
  night: ['#3A3470', '#181633'] as const, // céu do castelo à noite
  star: ['#FFE39A', '#FFC44D'] as const, // brilho da estrela
  dawn: ['#FFD6A5', '#FF9FB6'] as const, // amanhecer aconchegante
  playful: ['#FFC44D', '#FF8FB1'] as const, // estrela → bochecha
  readability: ['transparent', 'rgba(24,22,51,0.15)', 'rgba(24,22,51,0.92)'] as const,
} as const;

/** Sombras suaves e fofas (cards, botões flutuantes) — sensação de "flutuar". */
export const shadow = {
  soft: {
    shadowColor: '#3A3470',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  card: {
    shadowColor: '#3A3470',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#FFC44D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;

// AgeBand é tipo de domínio — vem de @lumi/shared (re-export por conveniência de import).
export type { AgeBand } from '@lumi/shared/types';
