import { createMockImageProvider } from '@/image/mock-provider';
import type { ImageProvider } from '@/image/types';

/**
 * Provider de ilustração. Hoje só o mock (gradiente + placeholders); quando houver
 * um serviço de geração de imagem, selecionar aqui por env (mesma interface).
 */
export const imageProvider: ImageProvider = createMockImageProvider();

export type { ImageProvider, Illustration, IllustrateInput } from '@/image/types';
