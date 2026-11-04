import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { sendEmailCode } from '@/api/member';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { onlyDigits } from '@/utils/money';

type Props = {
  email: string;
  onChangeEmail: (email: string) => void;
  code: string;
  onChangeCode: (code: string) => void;
  onSubmitEditing?: () => void;
};

// 이메일 + "인증번호 받기" + 인증번호 입력. 번호 확인은 제출할 때 서버가 한다
export function EmailCodeField({ email, onChangeEmail, code, onChangeCode, onSubmitEditing }: Props) {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [sending, setSending] = useState(false);

  async function onSend() {
    if (!email) {
      setIsError(true);
      return setMessage('이메일을 입력해주세요.');
    }
    setSending(true);
    try {
      await sendEmailCode(email);
      setIsError(false);
      setMessage('인증번호를 보냈습니다. 5분 안에 입력해주세요.');
    } catch (e) {
      setIsError(true);
      setMessage(e instanceof ApiError ? e.message : '서버에 연결할 수 없습니다.');
    } finally {
      setSending(false);
    }
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <>
      <View style={styles.row}>
        <TextInput
          style={[inputStyle, styles.flex]}
          placeholder="이메일"
          placeholderTextColor={theme.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={onChangeEmail}
        />
        <Pressable
          accessibilityRole="button"
          disabled={sending}
          onPress={onSend}
          style={({ pressed }) => [styles.sendButton, { borderColor: theme.text }, (pressed || sending) && styles.pressed]}>
          <ThemedText type="small">{sending ? '보내는 중...' : '인증번호 받기'}</ThemedText>
        </Pressable>
      </View>
      {!!message && (
        <ThemedText type="small" themeColor={isError ? undefined : 'textSecondary'} style={isError && styles.error}>
          {message}
        </ThemedText>
      )}
      <TextInput
        style={inputStyle}
        placeholder="인증번호 6자리"
        placeholderTextColor={theme.textSecondary}
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={(t) => onChangeCode(onlyDigits(t))}
        onSubmitEditing={onSubmitEditing}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  input: {
    height: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    fontSize: 16,
  },
  sendButton: {
    height: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  error: {
    color: '#e5484d',
  },
});
