import { apiFetch } from '@/lib/api/client';

/** Inicia a clonagem da voz no backend (/voice/clone → provider ElevenLabs). */
export async function cloneVoiceRemote(
  label: string,
  samplesBase64: string[] = [],
): Promise<{ voiceId: string; provider: string }> {
  return apiFetch<{ voiceId: string; provider: string }>('/voice/clone', {
    method: 'POST',
    body: JSON.stringify({ label, samplesBase64 }),
  });
}
