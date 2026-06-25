import { config } from '@/config';
import { registerSyncHandler } from '@/lib/services/sync';
import { cloneVoiceRemote } from '@/features/narration-voice/services/voice-repository';
import { useVoice } from '@/features/narration-voice/store/voice-store';

/**
 * Liga o item de outbox `clone_voice` à API real (/voice/clone). Só registra
 * quando há backend; offline o item é no-op e a voz fica pronta localmente.
 * Importado por efeito colateral no SyncManager.
 */
if (!config.useMocks) {
  registerSyncHandler('clone_voice', async (p) => {
    const { id, label, samplesBase64 } = p as {
      id: string;
      label: string;
      samplesBase64?: string[];
    };
    const res = await cloneVoiceRemote(label, samplesBase64 ?? []);
    useVoice.getState().markCloned(id, res.voiceId);
  });
}
