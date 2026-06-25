/**
 * Paleta do Lumi — personalizada sobre a estrutura da BNA UI.
 * Mantém TODAS as chaves que os componentes de @/components/ui esperam.
 *
 * - light: leitura diurna, fundo creme (não branco puro), marca roxa.
 * - dark:  modo leitura/noite, roxo-noite, roxo claro p/ contraste.
 * Ver docs/SPECS.md §1 (Branding) e docs/specs/atomics/tokens.md.
 */

const lightColors = {
  background: '#FFF9F0', // creme
  foreground: '#2D2A40',
  card: '#FFFFFF',
  cardForeground: '#2D2A40',
  popover: '#FFFFFF',
  popoverForeground: '#2D2A40',
  primary: '#6C5CE7', // roxo mágico
  primaryForeground: '#FFFFFF',
  secondary: '#F1ECFC', // tinta roxa clara (botões secundários)
  secondaryForeground: '#6C5CE7',
  muted: '#78788033',
  mutedForeground: '#7A7690',
  accent: '#FFF1DD',
  accentForeground: '#2D2A40',
  destructive: '#FF6B6B',
  destructiveForeground: '#FFFFFF',
  border: '#ECE3D5',
  input: '#EDE7DC',
  ring: '#A29BFE',
  text: '#2D2A40',
  textMuted: '#7A7690',
  tint: '#6C5CE7',
  icon: '#7A7690',
  tabIconDefault: '#7A7690',
  tabIconSelected: '#6C5CE7',
  // acentos da marca
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFB84C', // amarelo-estrela / karaokê base
  pink: '#FF7AA2',
  purple: '#6C5CE7',
  teal: '#4ECDC4',
  indigo: '#5856D6',
};

const darkColors = {
  background: '#1E1B2E', // roxo-noite (leitura)
  foreground: '#FFFFFF',
  card: '#2A2640',
  cardForeground: '#FFFFFF',
  popover: '#2A2640',
  popoverForeground: '#FFFFFF',
  primary: '#A29BFE', // roxo claro p/ contraste no escuro
  primaryForeground: '#1E1B2E',
  secondary: '#2A2640',
  secondaryForeground: '#FFFFFF',
  muted: '#78788033',
  mutedForeground: '#A9A4C2',
  accent: '#332E4D',
  accentForeground: '#FFFFFF',
  destructive: '#FF6B6B',
  destructiveForeground: '#FFFFFF',
  border: '#38344F',
  input: 'rgba(255, 255, 255, 0.15)',
  ring: '#A29BFE',
  text: '#FFFFFF',
  textMuted: '#A9A4C2',
  tint: '#A29BFE',
  icon: '#A9A4C2',
  tabIconDefault: '#A9A4C2',
  tabIconSelected: '#A29BFE',
  blue: '#0A84FF',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  pink: '#FF7AA2',
  purple: '#A29BFE',
  teal: '#64D2FF',
  indigo: '#5E5CE6',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

/** Cor sólida com opacidade (ex.: overlay do player). */
export function withOpacity(hex: string, opacity: number): string {
  const o = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${o}`;
}

export { darkColors, lightColors };
export type ColorKeys = keyof typeof lightColors;
