import { PAGES_BY_AGE, type AiProvider, type GeneratedStory, type GenerateStoryInput } from '@/ai/types';
import type { StoryTone } from '@lumi/shared';

/** Provider offline/dev: monta uma história simples sem chamar IA externa. */
const OPENERS: Record<StoryTone, string> = {
  calma: 'Numa tarde tranquila,',
  divertida: 'Que confusão divertida!',
  aventura: 'A grande aventura começou:',
};

const BEATS = [
  'tudo começou com %P.',
  'No caminho, surgiram amigos prontos para ajudar.',
  'Mas um pequeno problema apareceu e foi preciso coragem.',
  'Com uma ideia esperta, tudo ficou mais leve.',
  'Os amigos se uniram e aprenderam algo novo.',
  'Aos poucos, o sonho começou a se tornar realidade.',
  'E assim, com um sorriso, a história teve um final feliz.',
];

export function createMockAiProvider(): AiProvider {
  return {
    name: 'mock',
    async generateStory(input: GenerateStoryInput): Promise<GeneratedStory> {
      const n = PAGES_BY_AGE[input.ageBand];
      const hero = input.prompt.trim();
      const pages = Array.from({ length: n }, (_, i) => {
        const beat = BEATS[Math.min(i, BEATS.length - 1)].replace('%P', hero);
        return { text: i === 0 ? `${OPENERS[input.tone]} ${beat}` : beat };
      });
      const clean = hero.replace(/\.$/, '');
      const title = clean.charAt(0).toUpperCase() + clean.slice(1, 40);
      return { title, pages };
    },
  };
}
