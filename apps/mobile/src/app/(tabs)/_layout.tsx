import React from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { BookOpen, Library, Sparkles, User, type LucideProps } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColor } from '@/hooks/useColor';
import { radius, spacing } from '@/theme/tokens';

/** Ícone de tab com "pílula" suave atrás quando ativo (toque mais lúdico). */
function TabBarIcon({
  icon: IconCmp,
  color,
  focused,
  size = 24,
  pill,
}: {
  icon: React.ComponentType<LucideProps>;
  color: ColorValue;
  focused: boolean;
  size?: number;
  pill: string;
}) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: pill }]}>
      <IconCmp color={color as string} size={size} strokeWidth={focused ? 2.6 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  const active = useColor('tabIconSelected');
  const inactive = useColor('tabIconDefault');
  const bg = useColor('card');
  const border = useColor('border');
  const pill = useColor('secondary');
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: border,
          height: 66 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={BookOpen} color={color} focused={focused} pill={pill} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Criar',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Sparkles} color={color} focused={focused} size={26} pill={pill} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Library} color={color} focused={focused} pill={pill} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={User} color={color} focused={focused} pill={pill} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 48,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs / 2,
  },
});
