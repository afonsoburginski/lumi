import { env } from '@/env';
import { createGeminiImageProvider } from '@/image/gemini-provider';
import { createMockImageProvider } from '@/image/mock-provider';
import type { ImageProvider } from '@/image/types';

/**
 * Provider de ilustração: 'gemini' (geração real — requer billing) quando
 * IMAGE_PROVIDER=gemini e há chave; senão mock (gradiente + placeholders).
 */
export const imageProvider: ImageProvider =
  env.image.provider === 'gemini' && env.ai.geminiApiKey
    ? createGeminiImageProvider()
    : createMockImageProvider();

export type { ImageProvider, Illustration, IllustrateInput } from '@/image/types';
