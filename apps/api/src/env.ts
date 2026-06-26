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
  image: {
    // Ilustração: 'mock' (placeholder) ou 'gemini' (geração real — requer billing).
    provider: process.env.IMAGE_PROVIDER ?? 'mock',
    geminiImageModel: process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image',
  },
  storage: {
    // Cloudflare R2 (S3-compatible). Sem chaves → storage desabilitado (fallback
    // pro comportamento atual). Com chaves → imagens/áudio sobem pro bucket e o DB
    // guarda só as URLs públicas (servidas por R2_PUBLIC_BASE_URL atrás de CDN).
    bucket: process.env.R2_BUCKET ?? '',
    endpoint: process.env.R2_S3_ENDPOINT ?? '',
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
};
