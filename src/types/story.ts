import type { AgeBand } from '../theme/theme';

/** Status do pipeline de moderação (ver docs/SPECS.md §4). */
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';

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
  ageBand: AgeBand;
  coverUri: string;
  pages: StoryPage[];
  moderation: ModerationStatus;
  isPublic: boolean;
  likes: number;
}
