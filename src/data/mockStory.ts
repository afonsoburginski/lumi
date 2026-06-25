import type { Story } from '../types/story';

/**
 * História de exemplo para desenvolvimento do StoryPlayer.
 * Imagens via Unsplash (placeholder); na produção virão do pipeline de geração.
 *
 * Os `wordTimings` aqui são fictícios (gerados de forma uniforme) só para
 * demonstrar o efeito karaokê. Em produção virão do serviço de TTS/narração.
 */

function fakeTimings(text: string, startMs: number, totalMs: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const per = totalMs / words.length;
  return words.map((word, i) => ({
    word,
    startMs: Math.round(startMs + i * per),
    endMs: Math.round(startMs + (i + 1) * per),
  }));
}

const p1 = 'Era uma vez um cachorrinho chamado Pipoca que sonhava em voar bem alto.';
const p2 = 'Toda manhã, Pipoca olhava os passarinhos e abanava o rabinho de alegria.';
const p3 = 'Um dia, uma borboleta mágica sussurrou: acredite, e seus sonhos ganham asas!';

export const mockStory: Story = {
  id: 'story-001',
  title: 'O Cachorrinho que Queria Voar',
  authorId: 'user-mae',
  ageBand: '3-5',
  coverUri: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200',
  moderation: 'approved',
  isPublic: true,
  likes: 128,
  pages: [
    {
      id: 'pg-1',
      imageUri: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200',
      text: p1,
      wordTimings: fakeTimings(p1, 0, 6000),
    },
    {
      id: 'pg-2',
      imageUri: 'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=1200',
      text: p2,
      wordTimings: fakeTimings(p2, 0, 6000),
    },
    {
      id: 'pg-3',
      imageUri: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1200',
      text: p3,
      wordTimings: fakeTimings(p3, 0, 6000),
    },
  ],
};
