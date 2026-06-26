export const env = {
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
    accessTtlSec: 60 * 15, // 15 min
    refreshTtlSec: 60 * 60 * 24 * 30, // 30 dias
  },
  ai: {
    // Geração de histórias via Gemini (Google). Sem chave → provider mock offline.
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
  },
  voice: {
    // Presets de TTS via Gemini (reusa GEMINI_API_KEY); clonagem via ElevenLabs.
    geminiTtsModel: process.env.GEMINI_TTS_MODEL ?? 'gemini-2.5-flash-preview-tts',
    // Clonagem (voz da família) via ElevenLabs. Sem chave → sem clonagem.
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? '',
  },
};
