// @lumi/shared/voices — catálogo de vozes de narração (presets profissionais).
// Usado pelo app (lista do seletor) e pela API (roteia cada preset ao provider).
// Gemini TTS funciona já; ElevenLabs exige tier pago (free retorna 402) — quando
// houver upgrade, esses presets passam a tocar a voz real (sem mudar código);
// até lá, o roteador cai no Gemini automaticamente.

export type VoiceVendor = 'elevenlabs' | 'gemini';

export interface VoicePresetDef {
  /** id estável usado como voiceId em /voice/synthesize */
  id: string;
  label: string;
  vendor: VoiceVendor;
  /** ElevenLabs: voice_id; Gemini: nome da voz prebuilt */
  ref: string;
}

/** Voz padrão — uma voz Gemini calorosa (funciona sem upgrade). */
export const DEFAULT_VOICE_ID = 'gem-sulafat';

export const VOICE_PRESETS: VoicePresetDef[] = [
  // Gemini TTS — funcionam agora (sem custo de assinatura)
  { id: 'gem-sulafat', label: '🌙 Estrelinha · calorosa', vendor: 'gemini', ref: 'Sulafat' },
  { id: 'gem-leda', label: '🧚 Fada · jovem', vendor: 'gemini', ref: 'Leda' },
  { id: 'gem-aoede', label: '🍃 Brisa · leve', vendor: 'gemini', ref: 'Aoede' },
  { id: 'gem-vindemiatrix', label: '🤍 Aconchego · gentil', vendor: 'gemini', ref: 'Vindemiatrix' },
  { id: 'gem-achird', label: '😊 Amiguinha · simpática', vendor: 'gemini', ref: 'Achird' },
  { id: 'gem-algieba', label: '🎙️ Contador · suave', vendor: 'gemini', ref: 'Algieba' },
  { id: 'gem-charon', label: '📖 Narrador · clássico', vendor: 'gemini', ref: 'Charon' },
  // ElevenLabs — vozes profissionais da conta (precisam de upgrade pago p/ tocar)
  { id: 'carla', label: '📖 Carla · infantil (premium)', vendor: 'elevenlabs', ref: 'oJebhZNaPllxk6W0LSBA' },
  { id: 'graziella', label: '🧸 Graziella · infantil (premium)', vendor: 'elevenlabs', ref: 'iTvRNZPNPS0EiSgOCQG0' },
  { id: 'amanda', label: '🌷 Amanda · doce (premium)', vendor: 'elevenlabs', ref: 'oi8rgjIfLgJRsQ6rbZh3' },
  { id: 'yasmin', label: '🎵 Yasmin · musical (premium)', vendor: 'elevenlabs', ref: 'lWq4KDY8znfkV0DrK8Vb' },
  { id: 'roger', label: '👴 Roger · voz grave (premium)', vendor: 'elevenlabs', ref: 'CwhRBWXzGAHq8TQ4Fs17' },
];

export function findVoicePreset(id: string): VoicePresetDef | undefined {
  return VOICE_PRESETS.find((v) => v.id === id);
}
