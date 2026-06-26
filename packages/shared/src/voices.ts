// @lumi/shared/voices — catálogo de vozes de narração.
//
// 5 vozes ElevenLabs PROFESSIONAL (PT-BR) da conta do operador + 3 vozes Gemini
// TTS (variedade adicional). Strategy pattern na API: cada voz declara seu vendor
// e ref; o router (catalog-provider.ts) sintetiza estritamente com aquele vendor
// — SEM fallback cross-vendor (se a vendor falhar, a voz vira indisponível no
// picker, em vez de tocar voz errada).

export type VoiceVendor = 'elevenlabs' | 'gemini';

export interface VoicePresetDef {
  /** id estável usado como voiceId em /voice/synthesize */
  id: string;
  label: string;
  vendor: VoiceVendor;
  /** ElevenLabs: voice_id; Gemini: nome da voz prebuilt */
  ref: string;
}

/** Voz default — narradora infantil em PT-BR. */
export const DEFAULT_VOICE_ID = 'carla';

export const VOICE_PRESETS: VoicePresetDef[] = [
  // ElevenLabs Professional — vozes da conta do operador (PT-BR, professional cloning).
  { id: 'carla', label: '📖 Carla · narradora infantil', vendor: 'elevenlabs', ref: 'oJebhZNaPllxk6W0LSBA' },
  { id: 'luna', label: '🌙 Luna · suave e calma', vendor: 'elevenlabs', ref: 'jotBQRDYDizrWQAbv9VO' },
  { id: 'graziella', label: '🧸 Graziella · narradora infantil', vendor: 'elevenlabs', ref: 'iTvRNZPNPS0EiSgOCQG0' },
  { id: 'amanda', label: '🌷 Amanda · doce e calorosa', vendor: 'elevenlabs', ref: 'oi8rgjIfLgJRsQ6rbZh3' },
  { id: 'yasmin', label: '🎵 Yasmin · suave e musical', vendor: 'elevenlabs', ref: 'lWq4KDY8znfkV0DrK8Vb' },
  // Gemini TTS — variedade adicional (cota free 10/dia → algumas chamadas podem 429).
  { id: 'gem-sulafat', label: '🌙 Estrelinha · calorosa', vendor: 'gemini', ref: 'Sulafat' },
  { id: 'gem-leda', label: '🧚 Fada · jovem', vendor: 'gemini', ref: 'Leda' },
  { id: 'gem-charon', label: '📖 Narrador · clássico', vendor: 'gemini', ref: 'Charon' },
];

/** Todas as vozes que podem ser oferecidas. (Mantido por compat com chamadas
 *  existentes que filtram por requiresPaid — agora não há mais.) */
export const ACTIVE_VOICE_PRESETS: VoicePresetDef[] = VOICE_PRESETS;

export function findVoicePreset(id: string): VoicePresetDef | undefined {
  return VOICE_PRESETS.find((v) => v.id === id);
}
