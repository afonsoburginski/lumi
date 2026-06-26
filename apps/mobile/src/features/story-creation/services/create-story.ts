import { config } from '@/config';
import { uid } from '@/lib/id';
import { ApiResponseError } from '@/lib/api/client';
import { synthesize } from '@/features/narration-voice/services/tts';
import { fetchNarration } from '@/features/narration-voice/services/narration';
import { generateStory as generateLocal } from '@/features/story-creation/services/generation';
import { generateViaApi } from '@/features/story-creation/services/generation-repository';
import type { GenerateInput, GenerateResult } from '@/features/story-creation/services/generation';
import type { Story } from '@/types/domain';

/**
 * Pré-gera a narração premium (Gemini TTS) de cada página e cacheia o áudio
 * (documentDirectory) para tocar offline depois. Em paralelo; falha numa página
 * apenas deixa essa sem `audioUri` (player cai no expo-speech). Não bloqueia a
 * criação se a síntese toda falhar.
 */
async function preloadNarration(story: Story, voiceId: string): Promise<void> {
  await Promise.all(
    story.pages.map(async (page) => {
      try {
        const r = await fetchNarration({ text: page.text, voiceId, storyId: story.id, pageId: page.id });
        if (r.audioUri) {
          page.audioUri = r.audioUri;
          page.wordTimings = r.wordTimings;
        }
      } catch {
        // mantém a página sem áudio → fallback expo-speech
      }
    }),
  );
}

/**
 * Orquestra a criação de história (offline-first):
 * - com backend online → gera via API (Claude) e monta o Story localmente
 *   (narração/karaokê via tts); a moderação já rodou no servidor.
 * - sem backend / erro de rede → cai no gerador local (mock), que também modera.
 */
export async function createStory(input: GenerateInput): Promise<GenerateResult> {
  if (config.useMocks) return generateLocal(input);

  try {
    const dto = await generateViaApi({
      prompt: input.prompt,
      ageBand: input.ageBand,
      tone: input.tone,
      imageUri: input.imageUri,
    });
    const story: Story = {
      id: uid('st_'),
      title: dto.title,
      authorId: input.authorId,
      authorName: input.authorName,
      ageBand: input.ageBand,
      tone: input.tone,
      format: input.format ?? 'portrait',
      coverColors: dto.coverColors,
      pages: dto.pages.map((p) => ({
        id: uid('pg_'),
        imageUri: p.imageUri ?? '',
        text: p.text,
        wordTimings: synthesize(p.text, input.voiceId).wordTimings,
      })),
      moderation: 'approved',
      isPublic: false,
      likes: 0,
      createdAt: Date.now(),
      downloaded: true,
      pendingSync: true,
    };
    // Pré-gera a narração premium por página (não bloqueia se falhar).
    await preloadNarration(story, input.voiceId ?? 'preset-fada');
    return { ok: true, story };
  } catch (e) {
    // Conteúdo bloqueado pelo safety no servidor (422)
    if (e instanceof ApiResponseError && e.status === 422) {
      return {
        ok: false,
        blocked: { status: 'rejected', categories: [], score: 1, reason: e.body.message },
      };
    }
    // Rede/servidor indisponível → gera localmente (offline-first)
    return generateLocal(input);
  }
}
