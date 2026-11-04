import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { resetPassword } from '@/api/member';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { onlyDigits } from '@/utils/money';

export default function FindPasswordScreen() {
  const theme = useTheme();
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onReset() {
    if (!id || !name || !phoneNumber || !newPassword) return setError('모든 항목을 입력해주세요.');
    if (phoneNumber.length !== 11) return setError('휴대폰번호는 숫자 11자리로 입력해주세요.');
    if (newPassword.length > 20) return setError('비밀번호는 20자 이내로 입력해주세요.');
    setError('');
    setLoading(true);
    try {
      await resetPassword({ id, name, phoneNumber, newPassword });
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.title}>
            비밀번호 찾기
          </ThemedText>

          {done ? (
            <ThemedView type="backgroundElement" style={styles.result}>
              <ThemedText type="smallBold">비밀번호가 재설정되었습니다.</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">새 비밀번호로 로그인해주세요.</ThemedText>
            </ThemedView>
          ) : (
            <>
              <TextInput
                style={inputStyle}
                placeholder="아이디"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                value={id}
                onChangeText={setId}
              />
              <TextInput
                style={inputStyle}
                placeholder="이름"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={inputStyle}
                placeholder="휴대폰번호 (숫자 11자리)"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                maxLength={11}
                value={phoneNumber}
                onChangeText={(t) => setPhoneNumber(onlyDigits(t))}
              />
              <TextInput
                style={inputStyle}
                placeholder="새 비밀번호 (20자 이내)"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                maxLength={20}
                value={newPassword}
                onChangeText={setNewPassword}
                onSubmitEditing={onReset}
              />

              {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={onReset}
                style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, (pressed || loading) && styles.pressed]}>
                <ThemedText style={{ color: theme.background }}>{loading ? '재설정 중...' : '비밀번호 재설정'}</ThemedText>
              </Pressable>
            </>
          )}

          <Link href="/" replace style={styles.link}>
            <ThemedText type="small" themeColor="textSecondary">로그인으로 돌아가기</ThemedText>
          </Link>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
  },
  form: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.three,
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
  result: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
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
  link: {
    alignSelf: 'center',
  },
});
