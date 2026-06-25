import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, type RouteProp, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, gradients, radius, spacing } from '../theme/theme';
import StoryPlayer from '../components/StoryPlayer';
import { mockStory } from '../data/mockStory';
import type { Story } from '../types/story';

/* ----------------------------- Tipos de rota ----------------------------- */

export type RootStackParamList = {
  MainTabs: undefined;
  StoryPlayer: { story: Story };
};

export type MainTabsParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Library: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

/* ------------------------------- Telas base ------------------------------ */

function ScreenScaffold({ title, emoji, children }: { title: string; emoji: string; children?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.screenTitle}>
        {emoji} {title}
      </Text>
      {children}
    </View>
  );
}

function StoryCard({ story }: { story: Story }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('StoryPlayer', { story })}
      accessibilityRole="button"
      accessibilityLabel={`Ler ${story.title}`}
    >
      <LinearGradient colors={gradients.brand} style={styles.cardCover} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{story.title}</Text>
        <Text style={styles.cardMeta}>
          {story.ageBand} anos · ❤️ {story.likes} · ▶ Tocar
        </Text>
      </View>
    </Pressable>
  );
}

function HomeScreen() {
  return (
    <ScreenScaffold title="Olá! Vamos ler?" emoji="⭐">
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Recomendado para você</Text>
        <StoryCard story={mockStory} />
        <StoryCard story={{ ...mockStory, id: 's2', title: 'A Estrela Tímida', likes: 87 }} />
      </ScrollView>
    </ScreenScaffold>
  );
}

function ExploreScreen() {
  return (
    <ScreenScaffold title="Explorar" emoji="🔭">
      <Text style={styles.hint}>Pesquise histórias da comunidade. (Guest: 3 leituras/dia)</Text>
    </ScreenScaffold>
  );
}

function CreateScreen() {
  return (
    <ScreenScaffold title="Criar História" emoji="✨">
      <Text style={styles.hint}>Wizard de criação mágica (ver docs/SPECS.md §3).</Text>
      <View style={styles.safetyBadge}>
        <Text style={styles.safetyText}>🛡️ Toda história passa por verificação de segurança.</Text>
      </View>
    </ScreenScaffold>
  );
}

function LibraryScreen() {
  return (
    <ScreenScaffold title="Minha Biblioteca" emoji="📚">
      <Text style={styles.hint}>Suas histórias, favoritos e coleções (somente logado).</Text>
    </ScreenScaffold>
  );
}

function ProfileScreen() {
  return (
    <ScreenScaffold title="Perfil" emoji="🙂">
      <Text style={styles.hint}>Conta, faixa etária e voz da família.</Text>
    </ScreenScaffold>
  );
}

/* ------------------------------- Tab bar -------------------------------- */

const TAB_EMOJI: Record<keyof MainTabsParamList, string> = {
  Home: '🏠',
  Explore: '🔭',
  Create: '✨',
  Library: '📚',
  Profile: '🙂',
};

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }: { route: RouteProp<MainTabsParamList, keyof MainTabsParamList> }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 22, color }}>{TAB_EMOJI[route.name]}</Text>
        ),
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Explore" component={ExploreScreen} />
      <Tabs.Screen name="Create" component={CreateScreen} options={{ tabBarLabel: 'Criar' }} />
      <Tabs.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Biblioteca' }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tabs.Navigator>
  );
}

/* ----------------------------- Root navigator --------------------------- */

function StoryPlayerScreen({ route, navigation }: any) {
  const { story } = route.params as { story: Story };
  return <StoryPlayer story={story} onClose={() => navigation.goBack()} />;
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen
          name="StoryPlayer"
          component={StoryPlayerScreen}
          options={{ presentation: 'fullScreenModal', animation: 'fade' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgLight, paddingHorizontal: spacing.lg },
  screenTitle: { fontSize: fontSize.title, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  sectionLabel: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  hint: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 26 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardCover: { height: 140 },
  cardBody: { padding: spacing.md },
  cardTitle: { fontSize: fontSize.body, fontWeight: '800', color: colors.textPrimary },
  cardMeta: { fontSize: fontSize.caption, color: colors.textSecondary, marginTop: spacing.xs },
  safetyBadge: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(78,205,196,0.15)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  safetyText: { color: colors.textPrimary, fontWeight: '600' },
});
