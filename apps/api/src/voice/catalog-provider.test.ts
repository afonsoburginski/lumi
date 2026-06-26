import { describe, expect, test } from 'bun:test';
import { DEFAULT_VOICE_ID, findVoicePreset } from '@lumi/shared';

import { createVoiceRouter, type VoiceStrategy } from './catalog-provider';
import type { Narration } from './types';

const narration = (tag: string): Narration => ({
  audioBase64: tag,
  mimeType: 'audio/x',
  wordTimings: [],
  durationMs: 0,
});

/** Estratégia espiã: registra os `ref` recebidos e ou responde ou falha (429). */
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

const EL_BELLA_REF = findVoicePreset(DEFAULT_VOICE_ID)!.ref; // ref de fallback do ElevenLabs
const GEM_LEDA_REF = findVoicePreset('gem-leda')!.ref; // 'Leda'

describe('createVoiceRouter — strategy + fallback cross-vendor', () => {
  test('usa a vendor da voz escolhida quando ela funciona', async () => {
    const gem = spy('gemini', 'ok');
    const el = spy('eleven', 'ok');
    const router = createVoiceRouter({ gemini: gem.strategy, elevenlabs: el.strategy });

    const out = await router.synthesize('era uma vez', 'gem-leda');

    expect(out.audioBase64).toBe('gemini');
    expect(gem.calls).toEqual([GEM_LEDA_REF]); // chamou o Gemini com a ref do preset
    expect(el.calls).toEqual([]); // não precisou do fallback
  });

  test('faz fallback pro ElevenLabs quando o Gemini falha (429)', async () => {
    const gem = spy('gemini', 'fail');
    const el = spy('eleven', 'ok');
    const router = createVoiceRouter({ gemini: gem.strategy, elevenlabs: el.strategy });

    const out = await router.synthesize('era uma vez', 'gem-leda');

    expect(out.audioBase64).toBe('eleven'); // narração não ficou muda
    expect(gem.calls).toEqual([GEM_LEDA_REF]); // tentou o Gemini primeiro
    expect(el.calls).toEqual([EL_BELLA_REF]); // caiu pro ElevenLabs com voz padrão
  });

  test('voz ElevenLabs roteia direto pro ElevenLabs', async () => {
    const gem = spy('gemini', 'ok');
    const el = spy('eleven', 'ok');
    const router = createVoiceRouter({ gemini: gem.strategy, elevenlabs: el.strategy });

    const out = await router.synthesize('era uma vez', 'el-bella');

    expect(out.audioBase64).toBe('eleven');
    expect(el.calls).toEqual([EL_BELLA_REF]);
    expect(gem.calls).toEqual([]);
  });

  test('sem fallback disponível, propaga o erro', async () => {
    const gem = spy('gemini', 'fail');
    const router = createVoiceRouter({ gemini: gem.strategy });

    await expect(router.synthesize('era uma vez', 'gem-leda')).rejects.toThrow(/indisponível/);
  });
});
