import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// shortcut: placeholder until the 통장설정 screen is designed
export default function AccountSettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: '통장설정' }} />
      <ThemedText themeColor="textSecondary">준비 중입니다.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
