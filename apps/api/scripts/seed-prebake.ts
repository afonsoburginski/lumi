/**
 * Pré-bake one-shot das narrações das histórias-seed (Catarina × Catarina Sonhar)
 * em TODAS as vozes ativas. Bate na API prod via HTTP — usa o caching content-aware
 * do endpoint `/voice/synthesize` (storyId + pageId), que já garante idempotência
 * e empurra pro path correto no R2: `stories/<id>/audio/<voiceId>/<pageId>.<ext>`.
 *
 * Rode local apontando pra prod:
 *
 *   API_URL=https://lumi-api.31.97.253.138.sslip.io bun run scripts/seed-prebake.ts
 *
 * Vozes Gemini podem 429 (cota free 10/dia) — re-rode amanhã pra completar.
 */
import { ACTIVE_VOICE_PRESETS } from '@lumi/shared';

const API_URL = process.env.API_URL ?? 'http://localhost:3333';

interface SeedPage {
  pageId: string;
  text: string;
}

interface SeedStory {
  storyId: string;
  pages: SeedPage[];
}

// Espelha apps/mobile/src/lib/seed.ts (CATARINA_SONHAR_PAGES + cover).
const CATARINA_SONHAR: SeedStory = {
  storyId: 'catarina-sonhar',
  pages: [
    {
      pageId: 'catarina-sonhar-cover',
      text: 'O Show de Sonhar da Catarina. De Afonso Burginski.',
    },
    {
      pageId: 'catarina-sonhar-pg-1',
      text: 'Catarina tem olhos da cor do céu de inverno e cachinhos que pulam quando ela corre. Hoje, ela tem uma visita muito especial no seu quarto: a Luna! "Catarina!", diz Luna com um sorriso. "Eu quero saber! Qual será a nossa grande descoberta de hoje?"',
    },
    {
      pageId: 'catarina-sonhar-pg-2',
      text: 'Elas começam a brincar de fazer bolhas de sabão gigantes que flutuam pelo ar. Catarina solta gargalhadas e tenta pegar as bolhas com suas mãozinhas. Luna explica que cada bolha é como um pequeno mundo brilhante, refletindo todas as cores do arco-íris.',
    },
    {
      pageId: 'catarina-sonhar-pg-3',
      text: 'Depois, as duas usam a lupa da Luna para investigar o tapete de atividades. Elas descobrem que até as menores coisas têm detalhes incríveis. É uma aventura cheia de descobertas, saltos e muita diversão por todo o quarto.',
    },
    {
      pageId: 'catarina-sonhar-pg-4',
      text: 'De repente, as brincadeiras começam a ficar mais lentas. Catarina para de correr e solta um bocejo bem longo, esfregando um de seus olhinhos azul-acinzentados. O "Show da Luna" está ficando mais calmo e silencioso agora.',
    },
    {
      pageId: 'catarina-sonhar-pg-5',
      text: 'Luna percebe que sua amiguinha está com soninho. Ela se senta em uma almofada bem fofa e convida Catarina para um descanso. "Sabe, Catarina", sussurra Luna, "dormir é o experimento científico mais importante para a gente crescer bem forte."',
    },
    {
      pageId: 'catarina-sonhar-pg-6',
      text: 'Catarina encosta sua cabecinha no ombro de Luna. Elas olham para as estrelas de brinquedo que brilham suavemente no teto. Luna conta que, nos sonhos, elas podem voar até a Lua ou brincar em nuvens de algodão-doce.',
    },
    {
      pageId: 'catarina-sonhar-pg-7',
      text: 'Chegou a hora de dizer tchau. Luna dá um abraço bem apertado e aconchegante em Catarina. "Boa noite, pequena cientista", diz Luna com carinho. "Amanhã teremos muito mais coisas interessantes para descobrir!"',
    },
    {
      pageId: 'catarina-sonhar-pg-8',
      text: 'A Mamãe aparece na porta com um sorriso doce e os braços abertos. Ela pega Catarina no colo, sentindo o calorzinho do corpinho relaxado da filha. "Vamos para a cama grande, meu amor?", pergunta a Mamãe baixinho.',
    },
    {
      pageId: 'catarina-sonhar-pg-9',
      text: 'No quarto principal, o Papai já está esperando com o cobertor levantado. Catarina se aninha bem no meio da cama, sentindo o colchão macio e a segurança de ter o Papai por perto. Ele beija o topo da cabeça de Catarina com muito amor.',
    },
    {
      pageId: 'catarina-sonhar-pg-10',
      text: 'A Mamãe se deita do outro lado, cobrindo Catarina com todo o cuidado do mundo. Protegida no meio do papai e da mamãe, Catarina fecha os olhos e começa a sonhar com suas próximas aventuras. Boa noite, Catarina. Durma bem.',
    },
  ],
};

const CATARINA_JARDIM: SeedStory = {
  storyId: 'catarina',
  pages: [
    {
      pageId: 'catarina-pg-1',
      text: 'Era uma noite muito calma e o céu estava cheio de pontinhos brilhantes. A pequena Catarina estava em seu jardim, olhando para cima com muita curiosidade. De repente, sua amiga Luna apareceu com um sorriso gigante. "Catarina!", disse Luna. "Eu quero saber! Por que a noite é tão silenciosa e bonita?"',
    },
    {
      pageId: 'catarina-pg-2',
      text: 'Luna pegou a mão de Catarina e elas começaram a caminhar devagar pela grama macia. "Sabe, Catarina", explicou Luna, "as estrelas são como pequenas luzes de abajur que o universo acende para a gente não ter medo do escuro." Catarina deu um sorriso sonolento, observando o brilho lá no alto.',
    },
    {
      pageId: 'catarina-pg-3',
      text: 'O irmãozinho de Luna, Júpiter, apareceu bocejando muito. Ele trazia seu telescópio, mas parecia quase pronto para fechar os olhos. Luna explicou para Júpiter que a noite é o momento em que a Terra respira bem devagar para descansar de todas as brincadeiras do dia.',
    },
    {
      pageId: 'catarina-pg-4',
      text: 'O furão Cláudio também estava lá, mas ele já não queria mais pular. Cláudio se enrolou como uma bolinha de pelos perto de Júpiter. "Viu só?", disse Luna baixinho. "Até o Cláudio sabe que agora é a hora de baixar o volume do mundo."',
    },
    {
      pageId: 'catarina-pg-5',
      text: 'Luna e Catarina olharam para a Lua, que estava redonda e brilhante como uma grande luminária de prata. "A Lua é a nossa vigia, Catarina", disse Luna. "Ela fica acordada para que a gente possa sonhar com as coisas mais divertidas do mundo."',
    },
    {
      pageId: 'catarina-pg-6',
      text: '"Mas para onde vai o Sol, Luna?", perguntou Catarina com voz de sono. Luna fez um gesto suave em direção ao horizonte. "O Sol foi para o outro lado do mundo, Catarina. Ele foi contar histórias para outras crianças descansarem, enquanto a gente aproveita o frescor da noite."',
    },
    {
      pageId: 'catarina-pg-7',
      text: 'Catarina sentiu um bocejo bem grande vindo lá do fundo. Cláudio, o furão, rastejou até os pés de Catarina e soltou um som bem baixinho, como se estivesse dando boa noite. Luna acariciou o topo da cabeça de Catarina com muito carinho.',
    },
    {
      pageId: 'catarina-pg-8',
      text: '"Catarina", sussurrou Luna, "o show de hoje é o mais especial de todos. É o show do descanso! Quando fechamos os olhos, nossa imaginação cria cores que só existem nos sonhos." Luna deu um beijinho na bochecha de Catarina.',
    },
    {
      pageId: 'catarina-pg-9',
      text: 'Catarina se aninhou em seu cobertor fofinho, sentindo o silêncio da noite como um abraço. Cláudio dormia a seus pés. O Show da Luna agora era um show de estrelas cadentes silenciosas. Boa noite, Catarina. Durma bem com os seus sonhos curiosos.',
    },
  ],
};

const STORIES = [CATARINA_SONHAR, CATARINA_JARDIM];

async function synthOne(story: SeedStory, page: SeedPage, voiceId: string) {
  const body = {
    text: page.text,
    voiceId,
    storyId: story.storyId,
    pageId: page.pageId,
  };
  const res = await fetch(`${API_URL}/voice/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const tag = `${story.storyId}/${voiceId}/${page.pageId}`;
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.warn(`  ✗ ${tag} → HTTP ${res.status} ${txt.slice(0, 120)}`);
    return false;
  }
  console.log(`  ✓ ${tag}`);
  return true;
}

async function runPool<T>(items: T[], size: number, work: (item: T) => Promise<void>) {
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (true) {
        const i = idx++;
        if (i >= items.length) return;
        await work(items[i]).catch((err) => console.warn('pool err:', err));
      }
    }),
  );
}

async function main() {
  console.log(`[seed-prebake] API=${API_URL}`);
  console.log(`[seed-prebake] voices=${ACTIVE_VOICE_PRESETS.map((v) => v.id).join(', ')}\n`);

  for (const story of STORIES) {
    console.log(`# ${story.storyId} (${story.pages.length} pages)`);
    const jobs: { page: SeedPage; voiceId: string }[] = [];
    for (const page of story.pages) {
      for (const voice of ACTIVE_VOICE_PRESETS) {
        jobs.push({ page, voiceId: voice.id });
      }
    }
    // Concorrência baixa — providers têm rate-limit.
    await runPool(jobs, 2, async ({ page, voiceId }) => {
      await synthOne(story, page, voiceId);
    });
    console.log('');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
