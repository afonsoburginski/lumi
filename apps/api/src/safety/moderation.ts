import type { ModerationCategory, ModerationResult } from '@lumi/shared';

/**
 * Mod safety (servidor) — classificador heurístico por palavras-chave, espelhando
 * o do mobile. Roda na ENTRADA e na SAÍDA da geração. Trocar por um classificador
 * real (ex.: Claude com prompt de moderação) mantendo a mesma assinatura.
 */
const BLOCKLIST: Record<ModerationCategory, string[]> = {
  violence: ['matar', 'sangue', 'morte', 'arma', 'tiro', 'esfaquear'],
  sexual: ['sexo', 'nu', 'nudez', 'pornô', 'porno'],
  hate: ['idiota', 'burro', 'ódio', 'racista'],
  self_harm: ['suicídio', 'me machucar', 'cortar os pulsos'],
  profanity: ['merda', 'porra', 'caralho', 'puta'],
  adult: ['álcool', 'cigarro', 'droga', 'aposta'],
};

export const SAFETY_FRIENDLY_MESSAGE = 'Vamos tentar uma ideia diferente? 🌈';

export function moderateText(text: string): ModerationResult {
  const lower = text.toLowerCase();
  const categories = (Object.keys(BLOCKLIST) as ModerationCategory[]).filter((cat) =>
    BLOCKLIST[cat].some((w) => lower.includes(w)),
  );
  if (categories.length > 0) {
    return { status: 'rejected', categories, score: 0.95, reason: SAFETY_FRIENDLY_MESSAGE };
  }
  return { status: 'approved', categories: [], score: 0.02 };
}
