import { synthesize } from '@/lib/services/tts';
import type { AgeBand } from '@/theme/tokens';
import type { Story, StoryTone } from '@/lib/story/types';

/**
 * Histórias-semente da comunidade (offline-first: capas em gradiente, sem rede).
 * Servem de cache inicial enquanto não há backend.
 */
const IMG = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200',
  'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=1200',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1200',
];

function pages(texts: string[]) {
  return texts.map((text, i) => ({
    id: `seed-pg-${i}`,
    imageUri: IMG[i % IMG.length],
    text,
    wordTimings: synthesize(text).wordTimings,
  }));
}

interface SeedSpec {
  id: string;
  title: string;
  authorName: string;
  ageBand: AgeBand;
  tone: StoryTone;
  colors: [string, string];
  likes: number;
  texts: string[];
}

const SPECS: SeedSpec[] = [
  {
    id: 'seed-pipoca',
    title: 'O Cachorrinho que Queria Voar',
    authorName: 'Mãe da Lia',
    ageBand: '3-5',
    tone: 'aventura',
    colors: ['#6C5CE7', '#A29BFE'],
    likes: 128,
    texts: [
      'Era uma vez um cachorrinho chamado Pipoca que sonhava em voar bem alto.',
      'Toda manhã, Pipoca olhava os passarinhos e abanava o rabinho de alegria.',
      'Uma borboleta mágica sussurrou: acredite, e seus sonhos ganham asas!',
    ],
  },
  {
    id: 'seed-estrela',
    title: 'A Estrela Tímida',
    authorName: 'Vovô Chico',
    ageBand: '3-5',
    tone: 'calma',
    colors: ['#FFB84C', '#FF7AA2'],
    likes: 87,
    texts: [
      'No céu enorme, havia uma estrelinha tímida que tinha medo de brilhar.',
      'Os amigos do céu mostraram que sua luz era especial.',
      'Então ela brilhou, e a noite ficou mais bonita.',
    ],
  },
  {
    id: 'seed-foguete',
    title: 'O Foguete de Papel',
    authorName: 'Pai do Theo',
    ageBand: '6-8',
    tone: 'divertida',
    colors: ['#4ECDC4', '#6C5CE7'],
    likes: 203,
    texts: [
      'Theo dobrou um foguete de papel e sonhou em chegar à Lua.',
      'Soprou com força e o foguete cruzou a sala numa viagem maluca.',
      'No fim, descobriu que a maior viagem é a da imaginação.',
    ],
  },
  {
    id: 'seed-dragao',
    title: 'O Dragão Vegetariano',
    authorName: 'Tia Bel',
    ageBand: '6-8',
    tone: 'divertida',
    colors: ['#FF7AA2', '#FFB84C'],
    likes: 512,
    texts: [
      'Era uma vez um dragão que só queria comer brócolis e morangos.',
      'A vila estranhou, mas logo virou amiga do dragão gentil.',
      'Juntos, fizeram a maior salada do reino.',
    ],
  },
];

export function buildSeedStories(): Story[] {
  return SPECS.map((s) => ({
    id: s.id,
    title: s.title,
    authorId: `author-${s.id}`,
    authorName: s.authorName,
    ageBand: s.ageBand,
    tone: s.tone,
    coverColors: s.colors,
    pages: pages(s.texts),
    moderation: 'approved',
    isPublic: true,
    likes: s.likes,
    createdAt: Date.now(),
    downloaded: true,
  }));
}
