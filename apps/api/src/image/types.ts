import type { StoryTone } from '@lumi/shared';

export interface IllustrateInput {
  title: string;
  tone: StoryTone;
  pageTexts: string[];
}

export interface Illustration {
  /** gradiente da capa (offline-friendly) */
  coverColors: [string, string];
  /** uma imagem por página (URL) */
  pageImages: string[];
}

export interface ImageProvider {
  readonly name: string;
  illustrate(input: IllustrateInput): Promise<Illustration>;
}
