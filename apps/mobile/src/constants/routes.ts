/** Caminhos de rota centralizados (expo-router). Evita strings mágicas espalhadas. */
export const ROUTES = {
  home: '/(tabs)',
  explore: '/(tabs)/explore',
  create: '/(tabs)/create',
  library: '/(tabs)/library',
  profile: '/(tabs)/profile',
  login: '/(auth)/login',
  signup: '/(auth)/signup',
  authPrompt: '/auth-prompt',
  paywall: '/paywall',
  voiceClone: '/voice-clone',
  player: (id: string) => `/player/${id}`,
  story: (id: string) => `/story/${id}`,
  collection: (id: string) => `/collection/${id}`,
} as const;
