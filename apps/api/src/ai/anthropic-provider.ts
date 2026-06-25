import Anthropic from '@anthropic-ai/sdk';

import { env } from '@/env';
import { PAGES_BY_AGE, type AiProvider, type GeneratedStory, type GenerateStoryInput } from '@/ai/types';
import type { AgeBand, StoryTone } from '@lumi/shared';

/**
 * Geração de histórias com Claude (claude-opus-4-8). O prompt de sistema reforça
 * segurança infantil (camada 2 do mod safety) e adapta tom/complexidade à faixa.
 * Saída estruturada (JSON Schema) → { title, pages[] }.
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
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { text: { type: 'string' } },
        required: ['text'],
      },
    },
  },
  required: ['title', 'pages'],
} as const;

export function createAnthropicProvider(): AiProvider {
  const client = new Anthropic({ apiKey: env.ai.anthropicApiKey });

  return {
    name: 'anthropic',
    async generateStory(input) {
      const message = await client.messages.create({
        model: env.ai.model,
        max_tokens: 4000,
        system: systemPrompt(input),
        output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
        messages: [
          {
            role: 'user',
            content: `Crie uma história sobre: ${input.prompt}`,
          },
        ],
      });

      const textBlock = message.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('Resposta da IA sem conteúdo de texto');
      }
      return JSON.parse(textBlock.text) as GeneratedStory;
    },
  };
}
