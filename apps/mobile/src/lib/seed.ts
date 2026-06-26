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

/**
 * Versão nova "O Show de Sonhar da Catarina" — extraída do PDF gerado no Gemini
 * Storybook (história no quarto: bolhas, lupa, soninho, Mamãe e Papai). Ilustrações
 * recortadas do spread (metade esquerda) + texto fiel do PDF. Convive com a seed
 * antiga (`catarina`) — não substitui.
 */
// Narração pré-renderizada (voz el-bella) empacotada → toca OFFLINE, sem API.
const COVER_AUDIO2 = require('../../assets/stories/catarina-sonhar/audio/cover.mp3');
const AUDIO2 = [
  require('../../assets/stories/catarina-sonhar/audio/page-1.mp3'),
  require('../../assets/stories/catarina-sonhar/audio/page-2.mp3'),
  require('../../assets/stories/catarina-sonhar/audio/page-3.mp3'),
  require('../../assets/stories/catarina-sonhar/audio/page-4.mp3'),
  require('../../assets/stories/catarina-sonhar/audio/page-5.mp3'),
  require('../../assets/stories/catarina-sonhar/audio/page-6.mp3'),
  require('../../assets/stories/catarina-sonhar/audio/page-7.mp3'),
  require('../../assets/stories/catarina-sonhar/audio/page-8.mp3'),
  require('../../assets/stories/catarina-sonhar/audio/page-9.mp3'),
  require('../../assets/stories/catarina-sonhar/audio/page-10.mp3'),
];

const ART2 = {
  cover: require('../../assets/stories/catarina-sonhar/cover.jpg'),
  p1: require('../../assets/stories/catarina-sonhar/page-1.jpg'),
  p2: require('../../assets/stories/catarina-sonhar/page-2.jpg'),
  p3: require('../../assets/stories/catarina-sonhar/page-3.jpg'),
  p4: require('../../assets/stories/catarina-sonhar/page-4.jpg'),
  p5: require('../../assets/stories/catarina-sonhar/page-5.jpg'),
  p6: require('../../assets/stories/catarina-sonhar/page-6.jpg'),
  p7: require('../../assets/stories/catarina-sonhar/page-7.jpg'),
  p8: require('../../assets/stories/catarina-sonhar/page-8.jpg'),
  p9: require('../../assets/stories/catarina-sonhar/page-9.jpg'),
  p10: require('../../assets/stories/catarina-sonhar/page-10.jpg'),
};

const CATARINA_SONHAR_PAGES: { text: string; art: number }[] = [
  {
    text: 'Catarina tem olhos da cor do céu de inverno e cachinhos que pulam quando ela corre. Hoje, ela tem uma visita muito especial no seu quarto: a Luna! "Catarina!", diz Luna com um sorriso. "Eu quero saber! Qual será a nossa grande descoberta de hoje?"',
    art: ART2.p1,
  },
  {
    text: 'Elas começam a brincar de fazer bolhas de sabão gigantes que flutuam pelo ar. Catarina solta gargalhadas e tenta pegar as bolhas com suas mãozinhas. Luna explica que cada bolha é como um pequeno mundo brilhante, refletindo todas as cores do arco-íris.',
    art: ART2.p2,
  },
  {
    text: 'Depois, as duas usam a lupa da Luna para investigar o tapete de atividades. Elas descobrem que até as menores coisas têm detalhes incríveis. É uma aventura cheia de descobertas, saltos e muita diversão por todo o quarto.',
    art: ART2.p3,
  },
  {
    text: 'De repente, as brincadeiras começam a ficar mais lentas. Catarina para de correr e solta um bocejo bem longo, esfregando um de seus olhinhos azul-acinzentados. O "Show da Luna" está ficando mais calmo e silencioso agora.',
    art: ART2.p4,
  },
  {
    text: 'Luna percebe que sua amiguinha está com soninho. Ela se senta em uma almofada bem fofa e convida Catarina para um descanso. "Sabe, Catarina", sussurra Luna, "dormir é o experimento científico mais importante para a gente crescer bem forte."',
    art: ART2.p5,
  },
  {
    text: 'Catarina encosta sua cabecinha no ombro de Luna. Elas olham para as estrelas de brinquedo que brilham suavemente no teto. Luna conta que, nos sonhos, elas podem voar até a Lua ou brincar em nuvens de algodão-doce.',
    art: ART2.p6,
  },
  {
    text: 'Chegou a hora de dizer tchau. Luna dá um abraço bem apertado e aconchegante em Catarina. "Boa noite, pequena cientista", diz Luna com carinho. "Amanhã teremos muito mais coisas interessantes para descobrir!"',
    art: ART2.p7,
  },
  {
    text: 'A Mamãe aparece na porta com um sorriso doce e os braços abertos. Ela pega Catarina no colo, sentindo o calorzinho do corpinho relaxado da filha. "Vamos para a cama grande, meu amor?", pergunta a Mamãe baixinho.',
    art: ART2.p8,
  },
  {
    text: 'No quarto principal, o Papai já está esperando com o cobertor levantado. Catarina se aninha bem no meio da cama, sentindo o colchão macio e a segurança de ter o Papai por perto. Ele beija o topo da cabeça de Catarina com muito amor.',
    art: ART2.p9,
  },
  {
    text: 'A Mamãe se deita do outro lado, cobrindo Catarina com todo o cuidado do mundo. Protegida no meio do papai e da mamãe, Catarina fecha os olhos e começa a sonhar com suas próximas aventuras. Boa noite, Catarina. Durma bem.',
    art: ART2.p10,
  },
];

export function buildSeedStories(): Story[] {
  const catarina: Story = {
    id: 'catarina',
    title: 'O Jardim de Meia-Noite da Catarina',
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

  const catarinaSonhar: Story = {
    id: 'catarina-sonhar',
    title: 'O Show de Sonhar da Catarina',
    authorId: 'author-afonso',
    authorName: 'Afonso Burginski',
    ageBand: '3-5',
    tone: 'calma',
    format: 'landscape',
    coverColors: ['#7FB3C4', '#3E6B7A'],
    coverUri: assetUri(ART2.cover),
    // A CAPA é a 1ª página (id terminando em "-cover"): o narrador lê o título e
    // auto-avança pra página 1, como no Gemini Storybook.
    pages: [
      {
        id: 'catarina-sonhar-cover',
        imageUri: assetUri(ART2.cover),
        audioUri: assetUri(COVER_AUDIO2),
        text: 'O Show de Sonhar da Catarina. De Afonso Burginski.',
        wordTimings: synthesize('O Show de Sonhar da Catarina. De Afonso Burginski.').wordTimings,
      },
      ...CATARINA_SONHAR_PAGES.map((p, i) => ({
        id: `catarina-sonhar-pg-${i + 1}`,
        imageUri: assetUri(p.art),
        audioUri: assetUri(AUDIO2[i]),
        text: p.text,
        wordTimings: synthesize(p.text).wordTimings,
      })),
    ],
    moderation: 'approved',
    isPublic: true,
    likes: 87,
    createdAt: 1,
    downloaded: true,
  };

  return [catarinaSonhar, catarina];
}
