import { GoogleGenAI } from '@google/genai';

import { env } from '@/env';
import type { Illustration, IllustrateInput, ImageProvider } from '@/image/types';
import type { StoryTone } from '@lumi/shared';

/**
 * Ilustração via Gemini image (gemini-2.5-flash-image / "Nano Banana"). Gera uma
 * imagem por página no estilo de livro infantil. Para CONSISTÊNCIA de personagem,
 * a primeira imagem vira referência das seguintes (input multimodal). Sem texto
 * embutido na imagem (o app renderiza o texto na página de papel).
 *
 * Requer billing ativo na conta Gemini (no free tier retorna 429). Selecionado
 * só quando IMAGE_PROVIDER=gemini (ver @/image/index).
 */
const MODEL = env.image.geminiImageModel;

const COVER: Record<StoryTone, [string, string]> = {
  calma: ['#8E7BFF', '#6C5CE7'],
  divertida: ['#FFC44D', '#FF8FB1'],
  aventura: ['#5AD1C8', '#6C5CE7'],
};

const STYLE =
  'Ilustração de livro infantil, estilo cartoon 2D suave e caloroso, formas arredondadas, ' +
  'iluminação sonhadora e aconchegante, cores delicadas, personagens fofos e consistentes. ' +
  'NÃO inclua nenhum texto, letra ou legenda na imagem. Composição cheia, sem bordas brancas.';

function scenePrompt(title: string, pageText: string): string {
  return `${STYLE}\nCena para a história "${title}": ${pageText}`;
}

export function createGeminiImageProvider(): ImageProvider {
  const client = new GoogleGenAI({ apiKey: env.ai.geminiApiKey });

  async function generate(prompt: string, referenceBase64?: string): Promise<string | undefined> {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (referenceBase64) {
      parts.push({ inlineData: { mimeType: 'image/png', data: referenceBase64 } });
      parts.push({ text: 'Mantenha os MESMOS personagens, estilo e paleta da imagem de referência.' });
    }
    parts.push({ text: prompt });

    const res = await client.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: { responseModalities: ['IMAGE'] },
    });
    return res.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data ?? undefined;
  }

  return {
    name: 'gemini-image',
    async illustrate(input: IllustrateInput): Promise<Illustration> {
      const pageImages: string[] = [];
      let reference: string | undefined;

      for (const pageText of input.pageTexts) {
        const data = await generate(scenePrompt(input.title, pageText), reference);
        if (data) {
          if (!reference) reference = data; // 1ª imagem = referência de consistência
          pageImages.push(`data:image/png;base64,${data}`);
        } else {
          pageImages.push('');
        }
      }

      return { coverColors: COVER[input.tone], pageImages };
    },
  };
}
