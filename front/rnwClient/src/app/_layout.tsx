import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { loadSession, useSessionToken } from '@/api/session';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const token = useSessionToken();

  useEffect(() => {
    loadSession();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {/* Wait for the stored token: guarding before it's read would bounce a logged-in user to login. */}
      {token !== undefined && (
        <Stack screenOptions={{ headerShown: false }}>
          {/* Everything under (app) needs login; without a token the user lands on login (index). */}
          <Stack.Protected guard={!!token}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
        </Stack>
      )}
    </ThemeProvider>
  );
}
