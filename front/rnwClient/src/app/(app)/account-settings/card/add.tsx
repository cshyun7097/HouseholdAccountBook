import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { authedErrorMessage } from '@/api/auth-error';
import { createCard } from '@/api/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AddCardScreen() {
  const theme = useTheme();
  const [cardName, setCardName] = useState('');
  const [cardCompany, setCardCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onAdd() {
    if (!cardName.trim() || !cardCompany.trim()) return setError('모든 항목을 입력해주세요.');
    setError('');
    setLoading(true);
    try {
      await createCard({ cardName: cardName.trim(), cardCompany: cardCompany.trim() });
      // back, so a half-written entry on the write screen survives; after a web reload there is no history, so fall back
      if (router.canGoBack()) router.back();
      else router.dismissTo('/account-settings');
    } catch (e) {
      setError((await authedErrorMessage(e)) ?? '');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: '카드 추가' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <TextInput
          style={inputStyle}
          placeholder="카드 이름 (예: 생활비카드)"
          placeholderTextColor={theme.textSecondary}
          value={cardName}
          onChangeText={setCardName}
        />
        <TextInput
          style={inputStyle}
          placeholder="카드사"
          placeholderTextColor={theme.textSecondary}
          value={cardCompany}
          onChangeText={setCardCompany}
          onSubmitEditing={onAdd}
        />

        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={onAdd}
          style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, (pressed || loading) && styles.pressed]}>
          <ThemedText style={{ color: theme.background }}>{loading ? '추가 중...' : '추가하기'}</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  // the centered container would otherwise shrink the ScrollView to its content's width on web
  scroll: {
    width: '100%',
    maxWidth: 400,
  },
  form: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    height: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    fontSize: 16,
  },
  error: {
    color: '#e5484d',
  },
  button: {
    height: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
