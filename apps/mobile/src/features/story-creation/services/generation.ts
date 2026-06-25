import { uid } from '@/lib/id';
import { isOnline } from '@/lib/net/connectivity';
import { moderateText, moderateImage } from '@/features/safety/services/moderation';
import { synthesize } from '@/features/narration-voice/services/tts';
import type { AgeBand } from '@/theme/tokens';
import type { ModerationResult, Story, StoryPage, StoryTone } from '@/types/domain';

/**
 * Mod story-creation — geração de histórias. MOCK que roda offline: monta uma
 * história paginada a partir do prompt, adaptando quantidade/comprimento por
 * faixa etária e tom. Passa pelos guardrails do safety na ENTRADA e na SAÍDA.
 *
 * Ver docs/mods/story-creation/spec.md. Trocar `buildPages` por chamada de IA
 * real quando online, mantendo a assinatura `generateStory`.
 */

export interface GenerateInput {
  prompt: string;
  ageBand: AgeBand;
  tone: StoryTone;
  authorId: string;
  authorName?: string;
  imageUri?: string;
  voiceId?: string;
}

export type GenerateResult = { ok: true; story: Story } | { ok: false; blocked: ModerationResult };

const COVER_GRADIENTS: Record<StoryTone, [string, string]> = {
  calma: ['#6C5CE7', '#A29BFE'],
  divertida: ['#FFB84C', '#FF7AA2'],
  aventura: ['#4ECDC4', '#6C5CE7'],
};

const PAGES_BY_AGE: Record<AgeBand, number> = { '3-5': 3, '6-8': 5, '9-12': 7 };

const IMG = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200',
  'https://images.unsplash.com/photo-1444212477490-ca407925329e?w=1200',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1200',
  'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=1200',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200',
];

function titleFromPrompt(prompt: string): string {
  const clean = prompt.trim().replace(/\.$/, '');
  const short = clean.length > 40 ? clean.slice(0, 40) + '…' : clean;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

function buildPages(input: GenerateInput): StoryPage[] {
  const n = PAGES_BY_AGE[input.ageBand];
  const hero = input.prompt.trim();
  const toneOpener: Record<StoryTone, string> = {
    calma: 'Numa tarde tranquila,',
    divertida: 'Que confusão divertida!',
    aventura: 'A grande aventura começou:',
  };
  const beats = [
    `${toneOpener[input.tone]} tudo começou com ${hero}.`,
    `No caminho, surgiram amigos prontos para ajudar.`,
    `Mas um pequeno problema apareceu e foi preciso coragem.`,
    `Com uma ideia esperta, tudo ficou mais leve.`,
    `Os amigos se uniram e aprenderam algo novo.`,
    `Aos poucos, o sonho começou a se tornar realidade.`,
    `E assim, com um sorriso, a história teve um final feliz.`,
  ];
  return Array.from({ length: n }, (_, i) => {
    const text = beats[Math.min(i, beats.length - 1)];
    return {
      id: uid('pg_'),
      imageUri: IMG[i % IMG.length],
      text,
      wordTimings: synthesize(text, input.voiceId).wordTimings,
    };
  });
}

export function generateStory(input: GenerateInput): GenerateResult {
  // 1) Safety — moderação de ENTRADA
  const inMod = moderateText(input.prompt);
  if (inMod.status === 'rejected') return { ok: false, blocked: inMod };
  if (input.imageUri) {
    const imgMod = moderateImage(input.imageUri);
    if (imgMod.status === 'rejected') return { ok: false, blocked: imgMod };
  }

  // 2) Geração (offline-friendly)
  const pages = buildPages(input);

  // 3) Safety — moderação de SAÍDA (cada página)
  const outRejected = pages.map((p) => moderateText(p.text)).find((r) => r.status === 'rejected');
  if (outRejected) return { ok: false, blocked: outRejected };

  const story: Story = {
    id: uid('st_'),
    title: titleFromPrompt(input.prompt),
    authorId: input.authorId,
    authorName: input.authorName,
    ageBand: input.ageBand,
    tone: input.tone,
    coverColors: COVER_GRADIENTS[input.tone],
    pages,
    // online: revisão de servidor pendente; offline: aprovado localmente
    moderation: isOnline() ? 'needs_review' : 'approved',
    isPublic: false,
    likes: 0,
    createdAt: Date.now(),
    downloaded: true,
    pendingSync: isOnline(),
  };
  return { ok: true, story };
}
