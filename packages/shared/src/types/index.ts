// @lumi/shared/types — tipos de domínio compartilhados entre mobile e api.
// Fonte única da verdade do domínio Lumi.

export type AgeBand = '3-5' | '6-8' | '9-12';
export type StoryTone = 'calma' | 'divertida' | 'aventura';
/** Layout do leitor: 'portrait' = player cinematográfico vertical (padrão);
 *  'landscape' = livrinho horizontal (ilustração grande + texto). */
export type StoryFormat = 'portrait' | 'landscape';

/** Status do pipeline de moderação (ver docs/mods/safety). */
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

/** Uma palavra com timestamp, para o efeito karaokê na narração. */
export interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface StoryPage {
  id: string;
  imageUri: string;
  text: string;
  audioUri?: string;
  wordTimings?: WordTiming[];
}

export interface Story {
  id: string;
  title: string;
  authorId: string;
  authorName?: string;
  ageBand: AgeBand;
  tone?: StoryTone;
  /** Formato de leitura. Ausente = 'portrait' (compatível com histórias antigas). */
  format?: StoryFormat;
  coverColors?: [string, string];
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

export interface User {
  id: string;
  name: string;
  email: string;
  childAge: number;
  ageBand: AgeBand;
}

export interface ReadingQuota {
  date: string; // YYYY-MM-DD local
  count: number;
}

export interface VoiceProfile {
  id: string;
  ownerId: string;
  type: 'preset' | 'cloned';
  label: string;
  providerVoiceId: string;
  status: 'ready' | 'processing' | 'failed';
  consent?: boolean;
  createdAt: number;
}

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

export type OutboxType =
  | 'publish_story'
  | 'delete_story'
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
  score: number; // 0..1
  reason?: string;
}

/** Formato de leitura de uma história, com default seguro para conteúdo antigo. */
export function storyFormat(s: Pick<Story, 'format'>): StoryFormat {
  return s.format ?? 'portrait';
}

/** Faixa etária derivada da idade da criança. */
export function ageBandFromAge(age: number): AgeBand {
  if (age <= 5) return '3-5';
  if (age <= 8) return '6-8';
  return '9-12';
}

export const AGE_BANDS: AgeBand[] = ['3-5', '6-8', '9-12'];
