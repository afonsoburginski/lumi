// @lumi/shared/voices — catálogo de vozes de narração (presets profissionais).
// Cada voz declara seu VENDOR; a API usa strategy pattern (1 estratégia por vendor,
// sem fallback). ElevenLabs PREMADE funcionam no free; as vozes "library" da conta
// (requiresPaid) só com plano pago — ligam via ELEVENLABS_LIBRARY_ENABLED.

export type VoiceVendor = 'elevenlabs' | 'gemini';

export interface VoicePresetDef {
  /** id estável usado como voiceId em /voice/synthesize */
  id: string;
  label: string;
  vendor: VoiceVendor;
  /** ElevenLabs: voice_id; Gemini: nome da voz prebuilt */
  ref: string;
  /** ElevenLabs library/custom voices exigem plano pago (free → 402). */
  requiresPaid?: boolean;
}

/** Vozes library do ElevenLabs (suas vozes salvas) só com upgrade. Flip ao pagar. */
export const ELEVENLABS_LIBRARY_ENABLED = false;

/** Voz padrão — uma voz ElevenLabs premade (real, funciona no free). */
export const DEFAULT_VOICE_ID = 'el-bella';

export const VOICE_PRESETS: VoicePresetDef[] = [
  // ElevenLabs PREMADE — vozes reais que funcionam no free (com timestamps p/ karaokê)
  { id: 'el-bella', label: '🌟 Bella · brilhante e calorosa', vendor: 'elevenlabs', ref: 'hpp4J3VqNfWAUOO0d1Us' },
  { id: 'el-sarah', label: '🤍 Sarah · suave e tranquila', vendor: 'elevenlabs', ref: 'EXAVITQu4vr4xnSDxMaL' },
  { id: 'el-laura', label: '✨ Laura · animada', vendor: 'elevenlabs', ref: 'FGY2WhTYpPnrIDTdsKH5' },
  { id: 'el-roger', label: '👴 Roger · voz grave', vendor: 'elevenlabs', ref: 'CwhRBWXzGAHq8TQ4Fs17' },
  // Gemini TTS — variedade (também funcionam sem custo de assinatura)
  { id: 'gem-sulafat', label: '🌙 Estrelinha · calorosa', vendor: 'gemini', ref: 'Sulafat' },
  { id: 'gem-leda', label: '🧚 Fada · jovem', vendor: 'gemini', ref: 'Leda' },
  { id: 'gem-charon', label: '📖 Narrador · clássico', vendor: 'gemini', ref: 'Charon' },
  // ElevenLabs LIBRARY — suas vozes salvas (precisam de upgrade pago p/ tocar)
  { id: 'carla', label: '📖 Carla · narradora infantil', vendor: 'elevenlabs', ref: 'oJebhZNaPllxk6W0LSBA', requiresPaid: true },
  { id: 'graziella', label: '🧸 Graziella · narradora infantil', vendor: 'elevenlabs', ref: 'iTvRNZPNPS0EiSgOCQG0', requiresPaid: true },
  { id: 'amanda', label: '🌷 Amanda · doce e calorosa', vendor: 'elevenlabs', ref: 'oi8rgjIfLgJRsQ6rbZh3', requiresPaid: true },
  { id: 'yasmin', label: '🎵 Yasmin · suave e musical', vendor: 'elevenlabs', ref: 'lWq4KDY8znfkV0DrK8Vb', requiresPaid: true },
];

/** Presets realmente disponíveis (oculta as library quando sem upgrade). */
export const ACTIVE_VOICE_PRESETS: VoicePresetDef[] = VOICE_PRESETS.filter(
  (v) => !v.requiresPaid || ELEVENLABS_LIBRARY_ENABLED,
);

export function findVoicePreset(id: string): VoicePresetDef | undefined {
  return VOICE_PRESETS.find((v) => v.id === id);
}
