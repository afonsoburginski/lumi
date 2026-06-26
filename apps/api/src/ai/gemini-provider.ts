import { GoogleGenAI, Type } from '@google/genai';

import { env } from '@/env';
import { PAGES_BY_AGE, type AiProvider, type GeneratedStory, type GenerateStoryInput } from '@/ai/types';
import type { AgeBand, StoryTone } from '@lumi/shared';

/**
 * Geração de histórias com Gemini (gemini-2.5-flash). O prompt de sistema reforça
 * segurança infantil (camada 2 do mod safety) e adapta tom/complexidade à faixa.
 * Saída estruturada (responseSchema) → { title, pages[] }.
 */

const AGE_GUIDANCE: Record<AgeBand, string> = {
  '3-5': 'Frases muito curtas e simples. Vocabulário básico. Repetição gostosa. Nada assustador.',
  '6-8': 'Frases curtas, vocabulário simples, pequenas reviravoltas, humor leve.',
  '9-12': 'Tramas um pouco mais elaboradas, vocabulário um pouco maior, ainda 100% apropriado.',
};

const TONE_GUIDANCE: Record<StoryTone, string> = {
  calma: 'Tom calmo e aconchegante, ótimo para a hora de dormir.',
  divertida: 'Tom divertido e bobo, com situações engraçadas.',
  aventura: 'Tom de aventura leve, com descobertas e coragem.',
};

function systemPrompt(input: GenerateStoryInput): string {
  const pages = PAGES_BY_AGE[input.ageBand];
  return [
    'Você é um autor de histórias infantis em português do Brasil.',
    'Escreva histórias 100% apropriadas para crianças: gentis, positivas e seguras.',
    'PROIBIDO: violência gráfica, medo intenso, morte, conteúdo sexual, palavrões,',
    'temas adultos (álcool, drogas, apostas), discriminação ou qualquer perigo real.',
    `Faixa etária: ${input.ageBand} anos. ${AGE_GUIDANCE[input.ageBand]}`,
    `Tom desejado: ${input.tone}. ${TONE_GUIDANCE[input.tone]}`,
    `Estruture em exatamente ${pages} páginas, uma ideia por página, com um final feliz.`,
    'Responda APENAS no formato JSON solicitado, sem texto extra.',
  ].join(' ');
}

const OUTPUT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { text: { type: Type.STRING } },
        required: ['text'],
      },
    },
  },
  required: ['title', 'pages'],
};

export function createGeminiProvider(): AiProvider {
  const client = new GoogleGenAI({ apiKey: env.ai.geminiApiKey });

  return {
    name: 'gemini',
    async generateStory(input) {
      const response = await client.models.generateContent({
        model: env.ai.model,
        contents: `Crie uma história sobre: ${input.prompt}`,
        config: {
          systemInstruction: systemPrompt(input),
          responseMimeType: 'application/json',
          responseSchema: OUTPUT_SCHEMA,
          maxOutputTokens: 4000,
        },
      });

      const text = response.text;
      if (!text) throw new Error('Resposta da IA sem conteúdo de texto');
      return JSON.parse(text) as GeneratedStory;
    },
  };
}
