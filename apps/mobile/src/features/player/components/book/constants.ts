/** Paleta e medidas do livrinho (espelha o Gemini Storybook). */
export const BOOK = {
  backdrop: '#33373F', // mesa escura atrás do livro
  barBg: 'rgba(34,37,44,0.94)',
  barInk: '#E8E6E1',
  barMuted: '#9BA0A8',
  paper: '#F5EFE1', // papel creme
  ink: '#2B2A28', // tinta do texto
  inkSoft: '#9A958A', // autor / nº página
  playBlue: '#4F86F7',
  flipMs: 640,
  // Spread = 2 páginas (livro mais largo, ~como o print do PDF). Páginas ~0.70; a
  // ilustração preenche a página inteira (cover), cortando só uma fração de céu/chão.
  aspectRatio: 1.4,
  barBase: 52, // altura da barra (sem o safe-area top)
} as const;

/** Altura total da barra superior incluindo o respiro do safe-area. */
export function barTotalHeight(insetTop: number) {
  return Math.min(insetTop, 6) + BOOK.barBase;
}

/**
 * Dimensões do livro p/ ocupar o máximo da área disponível mantendo o aspecto.
 * Recebe a área JÁ descontada das margens/barra (o caller cuida disso) — assim
 * o notch lateral não rouba altura do livro.
 */
export function bookSize(availW: number, availH: number) {
  let w = availW;
  let h = w / BOOK.aspectRatio;
  if (h > availH) {
    h = availH;
    w = h * BOOK.aspectRatio;
  }
  return { width: w, height: h, half: w / 2 };
}
