import React, { useState } from 'react';
import { StyleSheet, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';

import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useColor } from '@/hooks/useColor';
import { useAuth } from '@/features/auth/store/auth-store';
import { ageBandFromAge } from '@/lib/age';
import { spacing } from '@/theme/tokens';

export default function SignupScreen() {
  const router = useRouter();
  const bg = useColor('background');
  const signup = useAuth((s) => s.signup);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');

  const ageNum = parseInt(age, 10);
  const valid = name.trim().length > 1 && email.includes('@') && ageNum >= 1 && ageNum <= 12;

  const submit = () => {
    if (!valid) return;
    signup(name.trim(), email, ageNum);
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <Text variant="caption" style={{ marginBottom: spacing.lg }}>
        Vamos personalizar as histórias para a idade da criança 🎈
      </Text>
      <Input
        placeholder="Seu nome"
        value={name}
        onChangeText={setName}
        containerStyle={styles.field}
      />
      <Input
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        containerStyle={styles.field}
      />
      <Input
        placeholder="Idade da criança (1 a 12)"
        keyboardType="number-pad"
        value={age}
        onChangeText={setAge}
        containerStyle={styles.field}
      />
      {ageNum >= 1 && ageNum <= 12 ? (
        <RNView style={styles.bandRow}>
          <Text variant="caption">Faixa recomendada: </Text>
          <Text variant="caption" style={{ fontWeight: '800' }}>
            {ageBandFromAge(ageNum)} anos
          </Text>
        </RNView>
      ) : null}
      <Button onPress={submit} disabled={!valid} style={{ marginTop: spacing.md }}>
        Criar conta
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.lg },
  field: { marginBottom: spacing.md },
  bandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
});
