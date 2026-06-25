import React from 'react';
import { Stack } from 'expo-router';

import { useColor } from '@/hooks/useColor';

export default function AuthLayout() {
  const bg = useColor('background');
  const text = useColor('text');
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: bg },
        headerTintColor: text,
        headerTitleStyle: { color: text },
        contentStyle: { backgroundColor: bg },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Entrar' }} />
      <Stack.Screen name="signup" options={{ title: 'Criar conta' }} />
    </Stack>
  );
}
