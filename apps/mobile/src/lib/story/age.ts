import type { AgeBand } from '@/theme/tokens';

/** Deriva a faixa etária a partir da idade informada no cadastro. */
export function ageBandFromAge(age: number): AgeBand {
  if (age <= 5) return '3-5';
  if (age <= 8) return '6-8';
  return '9-12';
}

export const AGE_BANDS: AgeBand[] = ['3-5', '6-8', '9-12'];
