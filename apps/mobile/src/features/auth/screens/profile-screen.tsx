import React from 'react';
import { Pressable, View as RNView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Mic, Play, Wifi, WifiOff } from 'lucide-react-native';
import { useShallow } from 'zustand/react/shallow';

import { Screen } from '@/components/shared/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { SectionTitle } from '@/components/shared/section-title';
import { useAuth } from '@/features/auth/store/auth-store';
import { useVoice } from '@/features/narration-voice/store/voice-store';
import { useVoicePreview } from '@/features/narration-voice/hooks/use-voice-preview';
import { useConnectivity } from '@/lib/net/connectivity';
import { useSync } from '@/lib/services/sync';
import { useColor } from '@/hooks/useColor';
import { radius, spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  const voices = useVoice(useShallow((s) => s.allVoices()));
  const selectedVoiceId = useVoice((s) => s.selectedVoiceId);
  const selectVoice = useVoice((s) => s.select);
  const { preview, loadingId, errorId } = useVoicePreview();

  const tint = useColor('primary');
  const activeBg = useColor('secondary');
  const danger = useColor('red');

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

      {/* Voz da narração — lista compacta: toque pra escolher, ▶ pra ouvir */}
      <SectionTitle icon={Mic}>Voz da narração</SectionTitle>
      <RNView style={styles.voiceList}>
        {voices.map((v) => {
          const active = selectedVoiceId === v.id;
          const failed = errorId === v.id;
          return (
            <Pressable
              key={v.id}
              onPress={() => selectVoice(v.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.voiceItem, active && { backgroundColor: activeBg }]}
            >
              <Pressable
                onPress={() => preview(v.id)}
                hitSlop={10}
                accessibilityLabel={`Ouvir ${v.label}`}
                style={[styles.previewBtn, { borderColor: failed ? danger : tint }]}
              >
                {loadingId === v.id ? (
                  <Spinner size="sm" />
                ) : (
                  <Icon name={Play} size={14} color={failed ? danger : tint} />
                )}
              </Pressable>
              <Text variant="body" numberOfLines={1} style={styles.voiceName}>
                {v.label}
              </Text>
              {active ? <Icon name={Check} size={18} color={tint} /> : null}
            </Pressable>
          );
        })}
      </RNView>

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
  voiceList: { gap: 2 },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 9,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  previewBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceName: { flex: 1 },
});
