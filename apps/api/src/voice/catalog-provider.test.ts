import { describe, expect, test } from 'bun:test';
import { findVoicePreset } from '@lumi/shared';

import { createVoiceRouter, type VoiceStrategy } from './catalog-provider';
import type { Narration } from './types';

const narration = (tag: string): Narration => ({
  audioBase64: tag,
  mimeType: 'audio/x',
  wordTimings: [],
  durationMs: 0,
});

/** Estratégia espiã: registra os `ref` recebidos e ou responde ou falha. */
function spy(tag: string, behavior: 'ok' | 'fail') {
  const calls: string[] = [];
  const strategy: VoiceStrategy = {
    async synthesize(_text, ref) {
      calls.push(ref);
      if (behavior === 'fail') throw new Error(`${tag} indisponível (cota)`);
      return narration(tag);
    },
  };
  return { strategy, calls };
}

const CARLA_REF = findVoicePreset('carla')!.ref; // ElevenLabs (id 'oJebhZNaPllxk6W0LSBA')
const GEM_LEDA_REF = findVoicePreset('gem-leda')!.ref; // 'Leda'

describe('createVoiceRouter — strategy estrita (sem fallback cross-vendor)', () => {
  test('voz ElevenLabs roteia direto pra ElevenLabs', async () => {
    const gem = spy('gemini', 'ok');
    const el = spy('eleven', 'ok');
    const router = createVoiceRouter({ gemini: gem.strategy, elevenlabs: el.strategy });

    const out = await router.synthesize('era uma vez', 'carla');

    expect(out.audioBase64).toBe('eleven');
    expect(el.calls).toEqual([CARLA_REF]);
    expect(gem.calls).toEqual([]);
  });

  test('voz Gemini roteia direto pra Gemini', async () => {
    const gem = spy('gemini', 'ok');
    const el = spy('eleven', 'ok');
    const router = createVoiceRouter({ gemini: gem.strategy, elevenlabs: el.strategy });

    const out = await router.synthesize('era uma vez', 'gem-leda');

    expect(out.audioBase64).toBe('gemini');
    expect(gem.calls).toEqual([GEM_LEDA_REF]);
    expect(el.calls).toEqual([]);
  });

  test('vendor da voz falha → propaga erro SEM fallback cross-vendor', async () => {
    const gem = spy('gemini', 'fail');
    const el = spy('eleven', 'ok');
    const router = createVoiceRouter({ gemini: gem.strategy, elevenlabs: el.strategy });

    await expect(router.synthesize('era uma vez', 'gem-leda')).rejects.toThrow(/indisponível/);

    expect(gem.calls).toEqual([GEM_LEDA_REF]);
    expect(el.calls).toEqual([]); // crítico: NÃO caiu na ElevenLabs
  });

  test('vendor não registrada → erro claro', async () => {
    const router = createVoiceRouter({ gemini: spy('gemini', 'ok').strategy });

    await expect(router.synthesize('era uma vez', 'carla')).rejects.toThrow(/elevenlabs.*não disponível/);
  });
});
