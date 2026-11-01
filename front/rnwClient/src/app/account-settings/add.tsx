import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { createAccount } from '@/api/account';
import { authedErrorMessage } from '@/api/auth-error';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AddAccountScreen() {
  const theme = useTheme();
  const [accountName, setAccountName] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onAdd() {
    if (!accountName || !bankInfo || !accountNumber || !balance) return setError('모든 항목을 입력해주세요.');
    const amount = Number(balance);
    if (!Number.isSafeInteger(amount)) return setError('잔액은 숫자로 입력해주세요.');
    setError('');
    setLoading(true);
    try {
      await createAccount({ accountName, bankInfo, accountNumber, balance: amount });
      router.dismissTo('/account-settings');
    } catch (e) {
      setError((await authedErrorMessage(e)) ?? '');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: '통장 추가' }} />
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <TextInput
          style={inputStyle}
          placeholder="통장 이름 (예: 월급통장)"
          placeholderTextColor={theme.textSecondary}
          value={accountName}
          onChangeText={setAccountName}
        />
        <TextInput
          style={inputStyle}
          placeholder="은행"
          placeholderTextColor={theme.textSecondary}
          value={bankInfo}
          onChangeText={setBankInfo}
        />
        <TextInput
          style={inputStyle}
          placeholder="계좌번호"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={accountNumber}
          onChangeText={setAccountNumber}
        />
        <TextInput
          style={inputStyle}
          placeholder="현재 잔액"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={balance}
          onChangeText={setBalance}
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
  form: {
    width: '100%',
    maxWidth: 400,
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
