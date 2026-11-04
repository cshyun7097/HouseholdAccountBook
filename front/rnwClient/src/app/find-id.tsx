import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { findId } from '@/api/member';
import { EmailCodeField } from '@/components/email-code-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function FindIdScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onFindId() {
    if (!email || !code) return setError('이메일과 인증번호를 입력해주세요.');
    setError('');
    setIds([]);
    setLoading(true);
    try {
      setIds(await findId(email, code));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.form}>
        <ThemedText type="subtitle" style={styles.title}>
          아이디 찾기
        </ThemedText>

        <EmailCodeField email={email} onChangeEmail={setEmail} code={code} onChangeCode={setCode} onSubmitEditing={onFindId} />

        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

        {ids.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.result}>
            <ThemedText type="small" themeColor="textSecondary">가입된 아이디</ThemedText>
            {ids.map((id) => (
              <ThemedText key={id} type="smallBold">{id}</ThemedText>
            ))}
          </ThemedView>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={onFindId}
          style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, (pressed || loading) && styles.pressed]}>
          <ThemedText style={{ color: theme.background }}>{loading ? '찾는 중...' : '아이디 찾기'}</ThemedText>
        </Pressable>

        <Link href="/" replace style={styles.link}>
          <ThemedText type="small" themeColor="textSecondary">로그인으로 돌아가기</ThemedText>
        </Link>
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
