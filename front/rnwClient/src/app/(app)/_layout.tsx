import { Stack } from 'expo-router';

// Screens that need login; the root layout guards this whole group.
// Menu screens draw their own AppHeader; only sub-screens (account add/detail, write) use this native header.
export default function AppLayout() {
  return (
    // iOS 26+ headers default to transparent, which drew non-scrolling screens (e.g. categories) under the header.
    // Minimal back button: home has no title, so iOS would show its route name.
    <Stack screenOptions={{ headerShown: false, headerTransparent: false, headerBackButtonDisplayMode: 'minimal' }} />
  );
}
