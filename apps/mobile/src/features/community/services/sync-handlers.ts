import { config } from '@/config';
import { registerSyncHandler } from '@/lib/services/sync';
import { useLibrary } from '@/features/community/store/library-store';
import {
  commentStoryRemote,
  deleteStoryRemote,
  likeStoryRemote,
  publishStoryRemote,
  rateStoryRemote,
} from '@/features/community/services/story-repository';
import { ApiResponseError } from '@/lib/api/client';

/**
 * Liga o outbox (offline-first) às chamadas reais da API. Só registra quando há
 * backend; em modo mock/offline os itens do outbox são tratados como no-op.
 * Importado por efeito colateral no _layout (registra na inicialização do app).
 */
if (!config.useMocks) {
  registerSyncHandler('like', async (p) => {
    const { storyId, liked } = p as { storyId: string; liked: boolean };
    await likeStoryRemote(storyId, liked);
  });

  registerSyncHandler('comment', async (p) => {
    const { storyId, text } = p as { storyId: string; text: string };
    await commentStoryRemote(storyId, text);
  });

  registerSyncHandler('rate', async (p) => {
    const { storyId, stars } = p as { storyId: string; stars: number };
    await rateStoryRemote(storyId, stars);
  });

  registerSyncHandler('publish_story', async (p) => {
    const { id } = p as { id: string };
    const story = useLibrary.getState().myStories.find((s) => s.id === id);
    if (story) await publishStoryRemote(story);
  });

  registerSyncHandler('delete_story', async (p) => {
    const { id } = p as { id: string };
    try {
      await deleteStoryRemote(id);
    } catch (err) {
      // Não publicada ou já apagada no servidor — sucesso pro client.
      if (err instanceof ApiResponseError && err.status === 404) return;
      throw err;
    }
  });
}
