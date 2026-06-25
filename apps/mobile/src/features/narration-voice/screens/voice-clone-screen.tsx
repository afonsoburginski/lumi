import React, { useState } from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { Mic, Square } from 'lucide-react-native';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useColor } from '@/hooks/useColor';
import { useAuth } from '@/features/auth/store/auth-store';
import { useVoice } from '@/features/narration-voice/store/voice-store';
import { spacing } from '@/theme/tokens';

const SAMPLE =
  '"Era uma vez, numa noite estrelada, uma família que adorava contar histórias antes de dormir."';

type Step = 'consent' | 'record' | 'done';

export default function VoiceCloneModal() {
  const router = useRouter();
  const bg = useColor('background');
  const user = useAuth((s) => s.user);
  const addClonedVoice = useVoice((s) => s.addClonedVoice);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [step, setStep] = useState<Step>('consent');
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sample, setSample] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startRecording = async () => {
    setError(null);
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      setError('Sem permissão de microfone — você ainda pode continuar sem gravar.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  };

  const stopRecording = async () => {
    await recorder.stop();
    setRecording(false);
    const uri = recorder.uri;
    if (uri) {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setSample(base64);
    }
  };

  const toggleRecord = () => {
    void (recording ? stopRecording() : startRecording());
  };

  const finish = () => {
    addClonedVoice(
      user?.id ?? 'guest',
      `🎙️ Voz de ${user?.name ?? 'casa'}`,
      consent,
      sample ? [sample] : [],
    );
    setStep('done');
  };

  const canFinish = sample !== null || error !== null;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <Text variant="title" style={{ marginBottom: spacing.md }}>
        🎙️ A voz da família
      </Text>

      {step === 'consent' && (
        <>
          <Text variant="caption" style={{ marginBottom: spacing.lg }}>
            Vamos gravar sua voz para narrar as histórias. Sua voz é um dado sensível: usamos apenas
            para narrar histórias da sua família e você pode apagá-la quando quiser.
          </Text>
          <Checkbox
            checked={consent}
            onCheckedChange={setConsent}
            label="Eu autorizo o uso da minha voz para narração (LGPD)."
          />
          <Button
            onPress={() => setStep('record')}
            disabled={!consent}
            style={{ marginTop: spacing.xl }}
          >
            Continuar
          </Button>
        </>
      )}

      {step === 'record' && (
        <>
          <Text variant="caption" style={{ marginBottom: spacing.md }}>
            Leia em voz alta, com calma:
          </Text>
          <Card style={{ marginBottom: spacing.lg }}>
            <CardContent style={{ paddingVertical: spacing.lg }}>
              <Text variant="subtitle">{SAMPLE}</Text>
            </CardContent>
          </Card>
          <RNView style={{ alignItems: 'center' }}>
            <Button
              size="lg"
              variant={recording ? 'destructive' : 'default'}
              icon={recording ? Square : Mic}
              onPress={toggleRecord}
            >
              {recording ? 'Parar gravação' : sample ? 'Regravar' : 'Gravar'}
            </Button>
            {recording ? (
              <Text variant="caption" style={{ marginTop: spacing.sm }}>
                Gravando… 🔴
              </Text>
            ) : null}
            {error ? (
              <Text
                variant="caption"
                lightColor="#FF6B6B"
                darkColor="#FF6B6B"
                style={{ marginTop: spacing.sm, textAlign: 'center' }}
              >
                {error}
              </Text>
            ) : null}
          </RNView>
          <Button onPress={finish} disabled={!canFinish} style={{ marginTop: spacing.xl }}>
            Criar minha voz
          </Button>
        </>
      )}

      {step === 'done' && (
        <>
          <Text variant="caption" style={{ marginBottom: spacing.xl }}>
            Prontinho! Sua voz foi registrada e já pode narrar as histórias. ✨
          </Text>
          <Button onPress={() => router.back()}>Concluir</Button>
        </>
      )}

      {step !== 'done' && (
        <Button variant="link" onPress={() => router.back()} style={{ marginTop: spacing.sm }}>
          Cancelar
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
});
