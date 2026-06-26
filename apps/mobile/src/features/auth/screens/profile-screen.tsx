import React from 'react';
import { View as RNView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Mic, Wifi, WifiOff } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';

import { Screen } from '@/components/shared/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SectionTitle } from '@/components/shared/section-title';
import { useAuth } from '@/features/auth/store/auth-store';
import { useVoice } from '@/features/narration-voice/store/voice-store';
import { useConnectivity } from '@/lib/net/connectivity';
import { useSync } from '@/lib/services/sync';
import { spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const voices = useVoice(useShallow((s) => s.allVoices()));
  const selectedVoiceId = useVoice((s) => s.selectedVoiceId);
  const selectVoice = useVoice((s) => s.select);

  const isOnline = useConnectivity((s) => s.isOnline);
  const toggleOnline = useConnectivity((s) => s.toggle);
  const pending = useSync((s) => s.outbox.length);
  const flush = useSync((s) => s.flush);

  return (
    <Screen title="🙂 Perfil">
      <RNView style={styles.header}>
        <Avatar size={64}>
          <AvatarFallback>{user ? user.name.slice(0, 1).toUpperCase() : '🙂'}</AvatarFallback>
        </Avatar>
        <RNView style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text variant="subtitle">{user ? user.name : 'Visitante'}</Text>
          <Text variant="caption">
            {user
              ? `Faixa ${user.ageBand} anos · ${user.email}`
              : 'Entre para criar e salvar histórias'}
          </Text>
        </RNView>
      </RNView>

      {!user ? (
        <>
          <Button onPress={() => router.push('/(auth)/signup')} style={{ marginTop: spacing.lg }}>
            Criar conta grátis
          </Button>
          <Button
            variant="ghost"
            onPress={() => router.push('/(auth)/login')}
            style={{ marginTop: spacing.sm }}
          >
            Já tenho conta
          </Button>
        </>
      ) : (
        <Button variant="outline" onPress={logout} style={{ marginTop: spacing.lg }}>
          Sair
        </Button>
      )}

      <Separator style={{ marginVertical: spacing.lg }} />

      {/* Vozes de narração */}
      <SectionTitle icon={Mic}>Vozes de narração</SectionTitle>
      {voices.map((v) => (
        <Card key={v.id} style={{ marginBottom: spacing.sm }}>
          <CardContent style={styles.voiceRow}>
            <RNView style={{ flex: 1 }}>
              <Text variant="body">{v.label}</Text>
              <Text variant="caption">
                {v.vendor === 'elevenlabs' ? 'Voz profissional' : 'Voz Gemini'}
              </Text>
            </RNView>
            <Button
              size="sm"
              variant={selectedVoiceId === v.id ? 'default' : 'secondary'}
              icon={selectedVoiceId === v.id ? Check : undefined}
              onPress={() => selectVoice(v.id)}
            >
              {selectedVoiceId === v.id ? 'Ativa' : 'Usar'}
            </Button>
          </CardContent>
        </Card>
      ))}

      <Separator style={{ marginVertical: spacing.lg }} />

      {/* Offline-first: simular conectividade */}
      <SectionTitle icon={Wifi}>Conectividade (demo)</SectionTitle>
      <Button
        icon={isOnline ? Wifi : WifiOff}
        variant={isOnline ? 'secondary' : 'destructive'}
        onPress={toggleOnline}
      >
        {isOnline ? 'Online — tocar para simular offline' : 'Offline — tocar para voltar online'}
      </Button>
      {pending > 0 ? (
        <Button variant="ghost" onPress={() => flush()} style={{ marginTop: spacing.sm }}>
          {`Sincronizar ${pending} ação(ões) pendente(s)`}
        </Button>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  voiceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
});
