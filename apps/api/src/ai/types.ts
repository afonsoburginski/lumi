import type { AgeBand, StoryTone } from '@lumi/shared';

export interface GenerateStoryInput {
  prompt: string;
  ageBand: AgeBand;
  tone: StoryTone;
}

export interface GeneratedPage {
  text: string;
}

export interface GeneratedStory {
  title: string;
  pages: GeneratedPage[];
}

export interface AiProvider {
  readonly name: string;
  generateStory(input: GenerateStoryInput): Promise<GeneratedStory>;
}

/** Nº de páginas por faixa etária (frases mais curtas/poucas páginas p/ os menores). */
export const PAGES_BY_AGE: Record<AgeBand, number> = { '3-5': 3, '6-8': 5, '9-12': 7 };
