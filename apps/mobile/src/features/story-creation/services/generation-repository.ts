import { apiFetch } from '@/lib/api/client';
import type { AgeBand, StoryTone } from '@lumi/shared/types';

/** Resposta do endpoint POST /stories/generate (IA no backend). */
export interface GeneratedStoryDto {
  title: string;
  ageBand: AgeBand;
  tone: StoryTone;
  coverColors?: [string, string];
  pages: { text: string; imageUri?: string }[];
  provider: string;
}

export interface GenerateApiInput {
  prompt: string;
  ageBand: AgeBand;
  tone: StoryTone;
  imageUri?: string;
}

/** Chama a geração por IA no backend (Claude). Lança ApiResponseError em 4xx/5xx. */
export async function generateViaApi(input: GenerateApiInput): Promise<GeneratedStoryDto> {
  return apiFetch<GeneratedStoryDto>('/stories/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
