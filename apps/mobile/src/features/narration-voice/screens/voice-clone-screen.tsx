import React, { useState } from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
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

  const [step, setStep] = useState<Step>('consent');
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);

  // NOTE: gravação real via expo-audio entra aqui (mock para funcionar offline).
  const toggleRecord = () => {
    if (recording) {
      setRecording(false);
      setRecorded(true);
    } else {
      setRecording(true);
      setRecorded(false);
    }
  };

  const finish = () => {
    addClonedVoice(user?.id ?? 'guest', `🎙️ Voz de ${user?.name ?? 'casa'}`, consent);
    setStep('done');
  };

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
              {recording ? 'Parar gravação' : recorded ? 'Regravar' : 'Gravar'}
            </Button>
            {recording ? (
              <Text variant="caption" style={{ marginTop: spacing.sm }}>
                Gravando… 🔴
              </Text>
            ) : null}
          </RNView>
          <Button onPress={finish} disabled={!recorded} style={{ marginTop: spacing.xl }}>
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
