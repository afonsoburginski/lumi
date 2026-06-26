import { Image } from 'react-native';

import { synthesize } from '@/features/narration-voice/services/tts';
import type { Story } from '@/types/domain';

/**
 * História-showcase real: "O Show de Sonhar da Catarina" (formato livrinho).
 * Ilustrações reais empacotadas em assets/stories/catarina (extraídas do PDF
 * gerado no Gemini Storybook). É a única seed — substitui os mocks antigos.
 */

// Ilustrações empacotadas (require estático p/ o Metro). A página 8 do PDF é
// só texto (sem arte), então reusa a cena da Lua (page-6) — repetição não-consecutiva.
const ART = {
  cover: require('../../assets/stories/catarina/cover.jpg'),
  p2: require('../../assets/stories/catarina/page-2.jpg'),
  p3: require('../../assets/stories/catarina/page-3.jpg'),
  p4: require('../../assets/stories/catarina/page-4.jpg'),
  p5: require('../../assets/stories/catarina/page-5.jpg'),
  p6: require('../../assets/stories/catarina/page-6.jpg'),
  p7: require('../../assets/stories/catarina/page-7.jpg'),
  p9: require('../../assets/stories/catarina/page-9.jpg'),
  p10: require('../../assets/stories/catarina/page-10.jpg'),
};

const assetUri = (mod: number): string => Image.resolveAssetSource(mod).uri;

const CATARINA_PAGES: { text: string; art: number }[] = [
  {
    text: 'Era uma noite muito calma e o céu estava cheio de pontinhos brilhantes. A pequena Catarina estava em seu jardim, olhando para cima com muita curiosidade. De repente, sua amiga Luna apareceu com um sorriso gigante. "Catarina!", disse Luna. "Eu quero saber! Por que a noite é tão silenciosa e bonita?"',
    art: ART.p2,
  },
  {
    text: 'Luna pegou a mão de Catarina e elas começaram a caminhar devagar pela grama macia. "Sabe, Catarina", explicou Luna, "as estrelas são como pequenas luzes de abajur que o universo acende para a gente não ter medo do escuro." Catarina deu um sorriso sonolento, observando o brilho lá no alto.',
    art: ART.p3,
  },
  {
    text: 'O irmãozinho de Luna, Júpiter, apareceu bocejando muito. Ele trazia seu telescópio, mas parecia quase pronto para fechar os olhos. Luna explicou para Júpiter que a noite é o momento em que a Terra respira bem devagar para descansar de todas as brincadeiras do dia.',
    art: ART.p4,
  },
  {
    text: 'O furão Cláudio também estava lá, mas ele já não queria mais pular. Cláudio se enrolou como uma bolinha de pelos perto de Júpiter. "Viu só?", disse Luna baixinho. "Até o Cláudio sabe que agora é a hora de baixar o volume do mundo."',
    art: ART.p5,
  },
  {
    text: 'Luna e Catarina olharam para a Lua, que estava redonda e brilhante como uma grande luminária de prata. "A Lua é a nossa vigia, Catarina", disse Luna. "Ela fica acordada para que a gente possa sonhar com as coisas mais divertidas do mundo."',
    art: ART.p6,
  },
  {
    text: '"Mas para onde vai o Sol, Luna?", perguntou Catarina com voz de sono. Luna fez um gesto suave em direção ao horizonte. "O Sol foi para o outro lado do mundo, Catarina. Ele foi contar histórias para outras crianças descansarem, enquanto a gente aproveita o frescor da noite."',
    art: ART.p7,
  },
  {
    text: 'Catarina sentiu um bocejo bem grande vindo lá do fundo. Cláudio, o furão, rastejou até os pés de Catarina e soltou um som bem baixinho, como se estivesse dando boa noite. Luna acariciou o topo da cabeça de Catarina com muito carinho.',
    art: ART.p6,
  },
  {
    text: '"Catarina", sussurrou Luna, "o show de hoje é o mais especial de todos. É o show do descanso! Quando fechamos os olhos, nossa imaginação cria cores que só existem nos sonhos." Luna deu um beijinho na bochecha de Catarina.',
    art: ART.p9,
  },
  {
    text: 'Catarina se aninhou em seu cobertor fofinho, sentindo o silêncio da noite como um abraço. Cláudio dormia a seus pés. O Show da Luna agora era um show de estrelas cadentes silenciosas. Boa noite, Catarina. Durma bem com os seus sonhos curiosos.',
    art: ART.p10,
  },
];

export function buildSeedStories(): Story[] {
  const catarina: Story = {
    id: 'catarina',
    title: 'O Show de Sonhar da Catarina',
    authorId: 'author-afonso',
    authorName: 'Afonso Burginski',
    ageBand: '6-8',
    tone: 'calma',
    format: 'landscape',
    coverColors: ['#3A3470', '#181633'],
    coverUri: assetUri(ART.cover),
    pages: CATARINA_PAGES.map((p, i) => ({
      id: `catarina-pg-${i + 1}`,
      imageUri: assetUri(p.art),
      text: p.text,
      wordTimings: synthesize(p.text).wordTimings,
    })),
    moderation: 'approved',
    isPublic: true,
    likes: 312,
    createdAt: 0,
    downloaded: true,
  };
  return [catarina];
}
