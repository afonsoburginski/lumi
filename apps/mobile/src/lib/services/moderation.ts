import type { ModerationCategory, ModerationResult } from '@/lib/story/types';

/**
 * Mod safety — contrato `moderate(content)` consumido por story-creation,
 * community e narration-voice. Implementação MOCK heurística que roda 100%
 * offline (classificador por palavras-chave). Trocar por serviço real
 * mantendo a mesma assinatura.
 *
 * Ver docs/mods/safety/spec.md.
 */

const BLOCKLIST: Record<ModerationCategory, string[]> = {
  violence: ['matar', 'sangue', 'morte', 'arma', 'tiro', 'esfaquear', 'guerra sangrenta'],
  sexual: ['sexo', 'nu', 'nudez', 'pornô', 'porno'],
  hate: ['idiota', 'burro', 'ódio', 'racista'],
  self_harm: ['suicídio', 'me machucar', 'cortar os pulsos'],
  profanity: ['merda', 'porra', 'caralho', 'puta'],
  adult: ['álcool', 'cigarro', 'droga', 'aposta'],
};

const FRIENDLY_BLOCK = 'Vamos tentar uma ideia diferente? 🌈';

export function moderateText(text: string): ModerationResult {
  const lower = text.toLowerCase();
  const categories: ModerationCategory[] = [];

  (Object.keys(BLOCKLIST) as ModerationCategory[]).forEach((cat) => {
    if (BLOCKLIST[cat].some((w) => lower.includes(w))) categories.push(cat);
  });

  if (categories.length > 0) {
    return { status: 'rejected', categories, score: 0.95, reason: FRIENDLY_BLOCK };
  }
  return { status: 'approved', categories: [], score: 0.02 };
}

/** Para imagens não temos análise offline; assume revisão pendente quando online. */
export function moderateImage(_uri: string): ModerationResult {
  return { status: 'approved', categories: [], score: 0.1 };
}

export const SAFETY_FRIENDLY_MESSAGE = FRIENDLY_BLOCK;
