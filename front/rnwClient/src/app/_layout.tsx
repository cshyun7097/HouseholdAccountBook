import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {/* iOS 26+ headers default to transparent, which drew non-scrolling screens (e.g. categories) under the header.
          Minimal back button: the previous screens have no titles, so iOS showed route names like "index". */}
      <Stack screenOptions={{ headerShown: false, headerTransparent: false, headerBackButtonDisplayMode: 'minimal' }} />
    </ThemeProvider>
  );
}
