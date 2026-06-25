import type { ImageProvider, Illustration, IllustrateInput } from '@/image/types';
import type { StoryTone } from '@lumi/shared';

/**
 * Provider de ilustração mock: capa em gradiente por tom + imagens placeholder.
 * Um provider real (ex.: modelo de geração de imagem) implementa a MESMA interface
 * — Claude não gera imagem, então a ilustração por IA é um plugue futuro.
 */
const COVER: Record<StoryTone, [string, string]> = {
  calma: ['#6C5CE7', '#A29BFE'],
  divertida: ['#FFB84C', '#FF7AA2'],
  aventura: ['#4ECDC4', '#6C5CE7'],
};

const IMG = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200',
  'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=1200',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1200',
  'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=1200',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200',
];

export function createMockImageProvider(): ImageProvider {
  return {
    name: 'mock',
    async illustrate(input: IllustrateInput): Promise<Illustration> {
      return {
        coverColors: COVER[input.tone],
        pageImages: input.pageTexts.map((_, i) => IMG[i % IMG.length]),
      };
    },
  };
}
