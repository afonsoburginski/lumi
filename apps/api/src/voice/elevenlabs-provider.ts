import { env } from '@/env';
import { uniformWordTimings, type Narration, type VoiceProvider, type VoicePreset } from '@/voice/types';
import type { WordTiming } from '@lumi/shared';

/**
 * TTS + clonagem via ElevenLabs (https://elevenlabs.io). Usa o endpoint
 * with-timestamps para obter alinhamento por caractere e derivar os wordTimings
 * do karaokê. Modelo multilíngue (PT-BR).
 */
const BASE = 'https://api.elevenlabs.io/v1';
const MODEL_ID = 'eleven_multilingual_v2';

// Presets → voice ids do ElevenLabs (exemplos; ajustar aos da conta).
const PRESETS: (VoicePreset & { providerVoiceId: string })[] = [
  { id: 'preset-epico', label: '🎙️ Narrador Épico', providerVoiceId: 'pNInz6obpgDQGcFmaJgB' },
  { id: 'preset-fada', label: '🧚 Fada', providerVoiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { id: 'preset-vovo', label: '👴 Vovô', providerVoiceId: 'VR6AewLTigWG4xSOukaG' },
];

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

/** Converte alinhamento por caractere (ElevenLabs) em timings por palavra. */
function charsToWordTimings(a: Alignment): WordTiming[] {
  const timings: WordTiming[] = [];
  let current = '';
  let start = 0;
  for (let i = 0; i < a.characters.length; i++) {
    const ch = a.characters[i];
    if (/\s/.test(ch)) {
      if (current) {
        timings.push({
          word: current,
          startMs: Math.round(start * 1000),
          endMs: Math.round(a.character_end_times_seconds[i - 1] * 1000),
        });
        current = '';
      }
    } else {
      if (!current) start = a.character_start_times_seconds[i];
      current += ch;
    }
  }
  if (current) {
    const last = a.character_end_times_seconds[a.character_end_times_seconds.length - 1] ?? 0;
    timings.push({ word: current, startMs: Math.round(start * 1000), endMs: Math.round(last * 1000) });
  }
  return timings;
}

function resolveVoiceId(voiceId: string): string {
  return PRESETS.find((p) => p.id === voiceId)?.providerVoiceId ?? voiceId;
}

export function createElevenLabsProvider(): VoiceProvider {
  const headers = { 'xi-api-key': env.voice.elevenLabsApiKey, 'Content-Type': 'application/json' };

  return {
    name: 'elevenlabs',
    listPresets: () => PRESETS.map(({ id, label }) => ({ id, label })),

    async synthesize(text, voiceId): Promise<Narration> {
      const res = await fetch(`${BASE}/text-to-speech/${resolveVoiceId(voiceId)}/with-timestamps`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, model_id: MODEL_ID }),
      });
      if (!res.ok) throw new Error(`ElevenLabs TTS falhou: ${res.status}`);
      const data = (await res.json()) as { audio_base64: string; alignment: Alignment };
      const wordTimings = charsToWordTimings(data.alignment);
      const durationMs = wordTimings.at(-1)?.endMs ?? 0;
      return { audioBase64: data.audio_base64, mimeType: 'audio/mpeg', wordTimings, durationMs };
    },

    async cloneVoice(label, samplesBase64): Promise<{ voiceId: string }> {
      // ElevenLabs Instant Voice Cloning: POST /v1/voices/add (multipart com amostras).
      const form = new FormData();
      form.append('name', label);
      samplesBase64.forEach((b64, i) => {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        form.append('files', new Blob([bytes], { type: 'audio/mpeg' }), `sample-${i}.mp3`);
      });
      const res = await fetch(`${BASE}/voices/add`, {
        method: 'POST',
        headers: { 'xi-api-key': env.voice.elevenLabsApiKey },
        body: form,
      });
      if (!res.ok) throw new Error(`ElevenLabs clone falhou: ${res.status}`);
      const data = (await res.json()) as { voice_id: string };
      return { voiceId: data.voice_id };
    },
  };
}

export { uniformWordTimings };
