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
    // Geração de histórias via Claude (Anthropic). Sem chave → provider mock offline.
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-8',
  },
  voice: {
    // TTS + clonagem via ElevenLabs. Sem chave → provider mock (só wordTimings).
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? '',
  },
};
