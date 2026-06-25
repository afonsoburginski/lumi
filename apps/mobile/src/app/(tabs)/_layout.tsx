import React from 'react';
import { Tabs } from 'expo-router';
import { BookOpen, Compass, Library, Sparkles, User } from 'lucide-react-native';

import { useColor } from '@/hooks/useColor';

export default function TabsLayout() {
  const active = useColor('tabIconSelected');
  const inactive = useColor('tabIconDefault');
  const bg = useColor('card');
  const border = useColor('border');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Início', tabBarIcon: ({ color }) => <BookOpen color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Explorar', tabBarIcon: ({ color }) => <Compass color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: 'Criar', tabBarIcon: ({ color }) => <Sparkles color={color} size={26} /> }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: 'Biblioteca', tabBarIcon: ({ color }) => <Library color={color} size={24} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: ({ color }) => <User color={color} size={24} /> }}
      />
    </Tabs>
  );
}
