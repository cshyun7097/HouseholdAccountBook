import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { login, signUp } from '@/api/member';
import { EmailCodeField } from '@/components/email-code-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { onlyDigits } from '@/utils/money';

export default function SignUpScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSignUp() {
    if (!name || !phoneNumber || !email || !code || !id || !password) return setError('모든 항목을 입력해주세요.');
    if (phoneNumber.length !== 11) return setError('휴대폰번호는 숫자 11자리로 입력해주세요.');
    if (password.length > 20) return setError('비밀번호는 20자 이내로 입력해주세요.');
    setError('');
    setLoading(true);
    try {
      await signUp({ name, phoneNumber, email, code, id, password });
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
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle" style={styles.title}>
            회원가입
          </ThemedText>

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
          <EmailCodeField email={email} onChangeEmail={setEmail} code={code} onChangeCode={setCode} />
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
            placeholder="비밀번호 (20자 이내)"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            maxLength={20}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={onSignUp}
          />

          {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={onSignUp}
            style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, (pressed || loading) && styles.pressed]}>
            <ThemedText style={{ color: theme.background }}>{loading ? '가입 중...' : '회원가입'}</ThemedText>
          </Pressable>

          <Link href="/" replace style={styles.link}>
            <ThemedText type="small" themeColor="textSecondary">이미 계정이 있으신가요? 로그인</ThemedText>
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
