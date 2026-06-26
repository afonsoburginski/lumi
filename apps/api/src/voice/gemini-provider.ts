import { GoogleGenAI } from '@google/genai';

import { env } from '@/env';
import { uniformWordTimings, type Narration, type VoicePreset, type VoiceProvider } from '@/voice/types';
import type { WordTiming } from '@lumi/shared';

/**
 * TTS via Gemini 2.5 (gemini-2.5-flash-preview-tts). Mesmo motor do Gemini
 * Storybook: vozes prebuilt + estilo controlável por prompt. Saída é PCM cru
 * (L16/24kHz/mono) → embrulhamos em WAV para o expo-audio tocar. O Gemini não
 * devolve timestamps por palavra, então geramos timings uniformes escalados à
 * duração real do áudio (karaokê aproximado).
 */

const SAMPLE_RATE = 24000;

// voiceName escolhido pela característica real da voz Gemini (Smooth/Youthful/Warm/Friendly).
// O `style` é a instrução de entrega (vem antes do texto: "<style>: <texto>").
const PRESETS: (VoicePreset & { voiceName: string; style: string })[] = [
  {
    id: 'preset-epico',
    label: '🎙️ Narrador Épico',
    voiceName: 'Algieba', // voz suave e rica
    style:
      'Você é um contador de histórias mágico narrando para uma criança na hora de dormir. Fale bem devagar, com calor e encanto, dando ênfase gentil às palavras importantes e fazendo pausas suaves entre as frases, como quem revela um segredo maravilhoso. Narre',
  },
  {
    id: 'preset-fada',
    label: '🧚 Fada',
    voiceName: 'Leda', // voz jovem e leve
    style:
      'Você é uma fada gentil e doce contando uma história para uma criancinha. Voz leve, carinhosa e cheia de ternura, bem devagar, com pausas suaves e um sorriso na voz. Narre',
  },
  {
    id: 'preset-vovo',
    label: '👴 Vovô',
    voiceName: 'Sulafat', // voz calorosa
    style:
      'Você é um vovô amoroso contando uma história de ninar para o netinho. Voz calma, acolhedora e tranquila, bem devagar, com pausas serenas e muito afeto. Narre',
  },
];

const DEFAULT_VOICE = 'Achird'; // voz amigável
const DEFAULT_STYLE =
  'Você é um contador de histórias infantil gentil e acolhedor. Voz calorosa e bem devagar, com pausas suaves. Narre';

/** PCM 16-bit mono → WAV (base64). Retorna o wav e a duração real em ms. */
function pcmToWav(pcmBase64: string, sampleRate = SAMPLE_RATE): { wavBase64: string; durationMs: number } {
  const pcm = Buffer.from(pcmBase64, 'base64');
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);

  const wav = Buffer.concat([header, pcm]);
  const durationMs = Math.round((pcm.length / (bitsPerSample / 8) / sampleRate) * 1000);
  return { wavBase64: wav.toString('base64'), durationMs };
}

/** Escala timings uniformes para a duração real do áudio (karaokê aproximado). */
function scaledTimings(text: string, durationMs: number): WordTiming[] {
  const raw = uniformWordTimings(text);
  const totalRaw = raw.at(-1)?.endMs ?? durationMs;
  const scale = totalRaw > 0 ? durationMs / totalRaw : 1;
  return raw.map((w) => ({
    word: w.word,
    startMs: Math.round(w.startMs * scale),
    endMs: Math.round(w.endMs * scale),
  }));
}

export function createGeminiVoiceProvider(): VoiceProvider {
  const client = new GoogleGenAI({ apiKey: env.ai.geminiApiKey });

  return {
    name: 'gemini-tts',
    listPresets: () => PRESETS.map(({ id, label }) => ({ id, label })),

    async synthesize(text, voiceId): Promise<Narration> {
      const preset = PRESETS.find((p) => p.id === voiceId);
      // voiceId pode ser um id de preset OU um nome de voz Gemini cru (vindo do catálogo).
      const voiceName = preset?.voiceName ?? (voiceId || DEFAULT_VOICE);
      const style = preset?.style ?? DEFAULT_STYLE;

      const response = await client.models.generateContent({
        model: env.voice.geminiTtsModel,
        contents: `${style}: ${text}`,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      });

      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!data) throw new Error('Gemini TTS não retornou áudio');

      const { wavBase64, durationMs } = pcmToWav(data);
      return {
        audioBase64: wavBase64,
        mimeType: 'audio/wav',
        wordTimings: scaledTimings(text, durationMs),
        durationMs,
      };
    },

    async cloneVoice(): Promise<{ voiceId: string }> {
      throw new Error('Clonagem de voz não é suportada pelo Gemini — use o ElevenLabs.');
    },
  };
}
