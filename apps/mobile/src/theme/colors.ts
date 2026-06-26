/**
 * Paleta do Lumi — identidade derivada da logo: estrelinha dourada brilhante,
 * céu azul sonhador, livro laranja, castelo/lua à noite. Mantém TODAS as chaves
 * que os componentes de @/components/ui esperam.
 *
 * - light: dia mágico, fundo céu claro e arejado, marca índigo + dourado-estrela.
 * - dark:  modo leitura/noite, índigo-noite profundo (céu do castelo).
 * Ver docs/SPECS.md §1 (Branding) e docs/specs/atomics/tokens.md.
 */

const lightColors = {
  background: '#F4F7FF', // céu claro arejado (era creme)
  foreground: '#2B2A4A',
  card: '#FFFFFF',
  cardForeground: '#2B2A4A',
  popover: '#FFFFFF',
  popoverForeground: '#2B2A4A',
  primary: '#6C5CE7', // índigo mágico (castelo) — bom contraste com branco
  primaryForeground: '#FFFFFF',
  secondary: '#ECEAFE', // tinta índigo clara (botões secundários)
  secondaryForeground: '#6C5CE7',
  muted: '#7878801F',
  mutedForeground: '#87859E',
  accent: '#FFF3D6', // tinta dourada (estrela)
  accentForeground: '#2B2A4A',
  destructive: '#FF6B6B',
  destructiveForeground: '#FFFFFF',
  border: '#E7E9F7',
  input: '#E7E9F7',
  ring: '#B9B4FB',
  text: '#2B2A4A',
  textMuted: '#87859E',
  tint: '#6C5CE7',
  icon: '#87859E',
  tabIconDefault: '#A6A3C2',
  tabIconSelected: '#6C5CE7',
  // acentos da marca (logo)
  blue: '#5B8DEF', // céu
  green: '#34C759',
  red: '#FF6B6B',
  orange: '#F2933E', // livro
  yellow: '#FFC44D', // dourado-estrela / karaokê base
  pink: '#FF8FB1', // bochechas
  purple: '#6C5CE7',
  teal: '#4ECDC4',
  indigo: '#5856D6',
};

const darkColors = {
  background: '#181633', // índigo-noite profundo (céu do castelo)
  foreground: '#FFFFFF',
  card: '#242145',
  cardForeground: '#FFFFFF',
  popover: '#242145',
  popoverForeground: '#FFFFFF',
  primary: '#A9A0FF', // índigo claro p/ contraste no escuro
  primaryForeground: '#181633',
  secondary: '#2C2952',
  secondaryForeground: '#FFFFFF',
  muted: '#7878801F',
  mutedForeground: '#ABA6C8',
  accent: '#332E55',
  accentForeground: '#FFFFFF',
  destructive: '#FF7B7B',
  destructiveForeground: '#FFFFFF',
  border: '#34305A',
  input: 'rgba(255, 255, 255, 0.15)',
  ring: '#A9A0FF',
  text: '#FFFFFF',
  textMuted: '#ABA6C8',
  tint: '#A9A0FF',
  icon: '#ABA6C8',
  tabIconDefault: '#7E7AA6',
  tabIconSelected: '#A9A0FF',
  blue: '#7FB0F7',
  green: '#30D158',
  red: '#FF7B7B',
  orange: '#FFAF5C',
  yellow: '#FFD66B', // dourado-estrela (glow noturno)
  pink: '#FF9DBC',
  purple: '#A9A0FF',
  teal: '#64D2FF',
  indigo: '#7E7AF0',
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
