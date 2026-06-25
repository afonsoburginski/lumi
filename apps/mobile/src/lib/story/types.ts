import type { AgeBand } from '@/theme/tokens';

/** Status do pipeline de moderação (ver docs/mods/safety). */
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

export type StoryTone = 'calma' | 'divertida' | 'aventura';

/** Uma palavra com timestamp, para o efeito karaokê na narração. */
export interface WordTiming {
  word: string;
  /** Início da palavra no áudio, em milissegundos. */
  startMs: number;
  /** Fim da palavra no áudio, em milissegundos. */
  endMs: number;
}

export interface StoryPage {
  id: string;
  /** URL/asset da ilustração de fundo. */
  imageUri: string;
  text: string;
  /** URL/asset do áudio de narração desta página. */
  audioUri?: string;
  /** Timings palavra-a-palavra para o karaokê (opcional). */
  wordTimings?: WordTiming[];
}

export interface Story {
  id: string;
  title: string;
  authorId: string;
  authorName?: string;
  ageBand: AgeBand;
  tone?: StoryTone;
  coverColors?: [string, string]; // gradiente da capa (offline-friendly)
  coverUri?: string;
  pages: StoryPage[];
  moderation: ModerationStatus;
  isPublic: boolean;
  likes: number;
  createdAt: number;
  /** offline-first */
  downloaded?: boolean;
  pendingSync?: boolean;
}

/* ----------------------------- Usuário / acesso ----------------------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  /** idade da criança informada no cadastro */
  childAge: number;
  ageBand: AgeBand;
}

export interface ReadingQuota {
  /** YYYY-MM-DD local */
  date: string;
  count: number;
}

/* ----------------------------- Voz / narração ------------------------------ */

export interface VoiceProfile {
  id: string;
  ownerId: string;
  type: 'preset' | 'cloned';
  label: string;
  /** id no provider de TTS/clonagem (mock offline = local) */
  providerVoiceId: string;
  status: 'ready' | 'processing' | 'failed';
  consent?: boolean;
  createdAt: number;
}

/* ----------------------------- Comunidade ---------------------------------- */

export interface Comment {
  id: string;
  storyId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
  moderation: ModerationStatus;
}

export interface Rating {
  storyId: string;
  userId: string;
  stars: number; // 1..5
}

export interface Collection {
  id: string;
  ownerId: string;
  title: string;
  visibility: 'private' | 'public';
  storyIds: string[];
  createdAt: number;
}

/* ----------------------------- Offline / sync ------------------------------ */

export type OutboxType =
  | 'publish_story'
  | 'like'
  | 'comment'
  | 'rate'
  | 'clone_voice'
  | 'signup'
  | 'login';

export interface OutboxItem {
  id: string;
  type: OutboxType;
  payload: unknown;
  status: 'queued' | 'syncing' | 'done' | 'failed';
  createdAt: number;
}

/* ----------------------------- Moderação ----------------------------------- */

export type ModerationCategory =
  | 'violence'
  | 'sexual'
  | 'hate'
  | 'self_harm'
  | 'profanity'
  | 'adult';

export interface ModerationResult {
  status: ModerationStatus;
  categories: ModerationCategory[];
  score: number; // 0..1 (maior = mais arriscado)
  reason?: string;
}
