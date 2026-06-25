import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useColor } from '@/hooks/useColor';
import { useAuth } from '@/features/auth/store/auth-store';
import { spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const bg = useColor('background');
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.includes('@') || password.length < 6) return;
    setLoading(true);
    setError(null);
    const res = await login(email, password);
    setLoading(false);
    if (res.ok) router.back();
    else setError(res.reason);
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <Text variant="caption" style={{ marginBottom: spacing.lg }}>
        Bom te ver de novo! ✨
      </Text>
      <Input
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        containerStyle={{ marginBottom: spacing.md }}
      />
      <Input
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        containerStyle={{ marginBottom: spacing.lg }}
      />
      {error ? (
        <Text
          variant="caption"
          lightColor="#FF6B6B"
          darkColor="#FF6B6B"
          style={{ marginBottom: spacing.sm }}
        >
          {error}
        </Text>
      ) : null}
      <Button
        onPress={submit}
        loading={loading}
        disabled={!email.includes('@') || password.length < 6}
      >
        Entrar
      </Button>
      <Link href="/(auth)/signup" style={{ marginTop: spacing.lg }}>
        <Text variant="link">Não tem conta? Criar agora</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.lg },
});
