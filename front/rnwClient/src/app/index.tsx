import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { login } from '@/api/member';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const theme = useTheme();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    if (!id || !password) return setError('아이디와 비밀번호를 입력해주세요.');
    setError('');
    setLoading(true);
    try {
      await login(id, password);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.form}>
        <ThemedText type="subtitle" style={styles.title}>
          로그인
        </ThemedText>

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
          placeholder="비밀번호"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={onLogin}
        />

        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={onLogin}
          style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, (pressed || loading) && styles.pressed]}>
          <ThemedText style={{ color: theme.background }}>{loading ? '로그인 중...' : '로그인'}</ThemedText>
        </Pressable>

        <ThemedView style={styles.links}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/find-id')}>
            <ThemedText type="small" themeColor="textSecondary">아이디 찾기</ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">|</ThemedText>
          <Pressable accessibilityRole="button" onPress={() => router.push('/find-password')}>
            <ThemedText type="small" themeColor="textSecondary">비밀번호 찾기</ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">|</ThemedText>
          <Pressable accessibilityRole="button" onPress={() => router.push('/sign-up')}>
            <ThemedText type="small" themeColor="textSecondary">회원가입</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
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
  button: {
    height: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
