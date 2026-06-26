// @lumi/shared/voices — catálogo de vozes de narração (presets profissionais).
// Usado pelo app (lista do seletor) e pela API (roteia cada preset ao provider).
// "Casa" ElevenLabs (vozes profissionais PT-BR) + Gemini TTS (variedade + limite maior).

export type VoiceVendor = 'elevenlabs' | 'gemini';

export interface VoicePresetDef {
  /** id estável usado como voiceId em /voice/synthesize */
  id: string;
  label: string;
  vendor: VoiceVendor;
  /** ElevenLabs: voice_id; Gemini: nome da voz prebuilt */
  ref: string;
}

/** Voz padrão (narradora infantil profissional). */
export const DEFAULT_VOICE_ID = 'carla';

export const VOICE_PRESETS: VoicePresetDef[] = [
  // ElevenLabs — vozes profissionais da conta (PT-BR)
  { id: 'carla', label: '📖 Carla · narradora infantil', vendor: 'elevenlabs', ref: 'oJebhZNaPllxk6W0LSBA' },
  { id: 'graziella', label: '🧸 Graziella · narradora infantil', vendor: 'elevenlabs', ref: 'iTvRNZPNPS0EiSgOCQG0' },
  { id: 'amanda', label: '🌷 Amanda · doce e calorosa', vendor: 'elevenlabs', ref: 'oi8rgjIfLgJRsQ6rbZh3' },
  { id: 'luna', label: '🌙 Luna · calma', vendor: 'elevenlabs', ref: 'jotBQRDYDizrWQAbv9VO' },
  { id: 'yasmin', label: '🎵 Yasmin · suave e musical', vendor: 'elevenlabs', ref: 'lWq4KDY8znfkV0DrK8Vb' },
  { id: 'bella', label: '🌟 Bella · brilhante e calorosa', vendor: 'elevenlabs', ref: 'hpp4J3VqNfWAUOO0d1Us' },
  { id: 'sarah', label: '🤍 Sarah · madura e tranquila', vendor: 'elevenlabs', ref: 'EXAVITQu4vr4xnSDxMaL' },
  { id: 'roger', label: '👴 Roger · voz grave', vendor: 'elevenlabs', ref: 'CwhRBWXzGAHq8TQ4Fs17' },
  { id: 'laura', label: '✨ Laura · animada', vendor: 'elevenlabs', ref: 'FGY2WhTYpPnrIDTdsKH5' },
  // Gemini TTS — variedade + limite maior (fallback quando o ElevenLabs estoura a cota)
  { id: 'gem-sulafat', label: '🌠 Estrela · calorosa (Gemini)', vendor: 'gemini', ref: 'Sulafat' },
  { id: 'gem-leda', label: '🧚 Fada · jovem (Gemini)', vendor: 'gemini', ref: 'Leda' },
  { id: 'gem-charon', label: '🎙️ Contador · épico (Gemini)', vendor: 'gemini', ref: 'Algieba' },
];

export function findVoicePreset(id: string): VoicePresetDef | undefined {
  return VOICE_PRESETS.find((v) => v.id === id);
}
