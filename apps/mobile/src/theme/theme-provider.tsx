import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as RNThemeProvider,
} from 'expo-router/react-navigation';
import 'react-native-reanimated';
import React from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';

type Props = {
  children: React.ReactNode;
};

export const ThemeProvider = ({ children }: Props) => {
  const colorScheme = useColorScheme();

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.primary,
      background: Colors.light.background,
      card: Colors.light.card,
      text: Colors.light.text,
      border: Colors.light.border,
      notification: Colors.light.red,
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.dark.primary,
      background: Colors.dark.background,
      card: Colors.dark.card,
      text: Colors.dark.text,
      border: Colors.dark.border,
      notification: Colors.dark.red,
    },
  };

  return (
    <RNThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
      {children}
    </RNThemeProvider>
  );
};
