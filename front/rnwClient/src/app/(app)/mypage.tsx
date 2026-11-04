import { useEffect, useState } from 'react';
import { Pressable, ScrollView, type StyleProp, StyleSheet, TextInput, type TextStyle } from 'react-native';

import { authedErrorMessage } from '@/api/auth-error';
import { getMemberInfo, type MemberInfo, updateMember, type UpdateMemberRequest, withdraw } from '@/api/member';
import { AppHeader } from '@/components/app-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { onlyDigits } from '@/utils/money';

export default function MyPageScreen() {
  const theme = useTheme();
  const [info, setInfo] = useState<MemberInfo>();
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getMemberInfo()
      .then(setInfo)
      .catch(async (e) => setLoadError((await authedErrorMessage(e)) ?? ''));
  }, []);

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.background }];

  return (
    <ThemedView style={styles.container}>
      <AppHeader title="마이페이지" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">내 정보</ThemedText>
          {info ? (
            (
              [
                ['이름', info.name],
                ['아이디', info.id],
                ['휴대폰번호', info.phoneNumber],
              ] as const
            ).map(([label, value]) => (
              <ThemedView key={label} type="backgroundElement" style={styles.row}>
                <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
                <ThemedText type="small">{value}</ThemedText>
              </ThemedView>
            ))
          ) : (
            <ThemedText type="small" style={loadError ? styles.error : undefined} themeColor="textSecondary">
              {loadError || '불러오는 중...'}
            </ThemedText>
          )}
        </ThemedView>

        <UpdateForm
          title="휴대폰번호 변경"
          inputStyle={inputStyle}
          fields={[{ key: 'phoneNumber', placeholder: '새 휴대폰번호 (숫자 11자리)', keyboardType: 'phone-pad', maxLength: 11, digitsOnly: true }]}
          validate={(v) => (v.phoneNumber.length !== 11 ? '휴대폰번호는 숫자 11자리로 입력해주세요.' : '')}
          toRequest={(v) => ({ phoneNumber: v.phoneNumber })}
          onDone={(v) => info && setInfo({ ...info, phoneNumber: v.phoneNumber })}
          doneMessage="휴대폰번호가 변경되었습니다."
        />

        <UpdateForm
          title="비밀번호 변경"
          inputStyle={inputStyle}
          fields={[
            { key: 'password', placeholder: '새 비밀번호 (20자 이내)', secure: true, maxLength: 20 },
            { key: 'passwordConfirm', placeholder: '새 비밀번호 확인', secure: true, maxLength: 20 },
          ]}
          validate={(v) => (v.password !== v.passwordConfirm ? '새 비밀번호가 서로 다릅니다.' : '')}
          toRequest={(v) => ({ password: v.password })}
          doneMessage="비밀번호가 변경되었습니다."
        />

        <WithdrawForm inputStyle={inputStyle} />
      </ScrollView>
    </ThemedView>
  );
}

type Field = { key: string; placeholder: string; secure?: boolean; keyboardType?: 'phone-pad'; maxLength?: number; digitsOnly?: boolean };

// Both changes need the current password (the backend checks it), so each form carries its own.
function UpdateForm({
  title,
  fields,
  inputStyle,
  validate,
  toRequest,
  onDone,
  doneMessage,
}: {
  title: string;
  fields: Field[];
  inputStyle: StyleProp<TextStyle>;
  validate?: (values: Record<string, string>) => string;
  toRequest: (values: Record<string, string>) => Omit<UpdateMemberRequest, 'currentPassword'>;
  onDone?: (values: Record<string, string>) => void;
  doneMessage: string;
}) {
  const theme = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [message, setMessage] = useState({ text: '', ok: false });
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (fields.some((f) => !values[f.key]?.trim()) || !currentPassword) {
      return setMessage({ text: '모든 항목을 입력해주세요.', ok: false });
    }
    const invalid = validate?.(values);
    if (invalid) return setMessage({ text: invalid, ok: false });
    setLoading(true);
    try {
      await updateMember({ currentPassword, ...toRequest(values) });
      onDone?.(values);
      setValues({});
      setCurrentPassword('');
      setMessage({ text: doneMessage, ok: true });
    } catch (e) {
      setMessage({ text: (await authedErrorMessage(e)) ?? '', ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {fields.map((f) => (
        <TextInput
          key={f.key}
          style={inputStyle}
          placeholder={f.placeholder}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={f.secure}
          keyboardType={f.keyboardType}
          maxLength={f.maxLength}
          value={values[f.key] ?? ''}
          onChangeText={(text) => setValues({ ...values, [f.key]: f.digitsOnly ? onlyDigits(text) : text })}
        />
      ))}
      <TextInput
        style={inputStyle}
        placeholder="현재 비밀번호"
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
        onSubmitEditing={onSubmit}
      />
      {!!message.text && (
        <ThemedText type="small" style={message.ok ? undefined : styles.error} themeColor="textSecondary">
          {message.text}
        </ThemedText>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={onSubmit}
        style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, (pressed || loading) && styles.pressed]}>
        <ThemedText style={{ color: theme.background }}>{loading ? '변경 중...' : '변경하기'}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

// Typing the current password is the confirmation step (Alert buttons don't work on web).
function WithdrawForm({ inputStyle }: { inputStyle: StyleProp<TextStyle> }) {
  const theme = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onWithdraw() {
    if (!currentPassword) return setError('현재 비밀번호를 입력해주세요.');
    setError('');
    setLoading(true);
    try {
      await withdraw(currentPassword);
    } catch (e) {
      setError((await authedErrorMessage(e)) ?? '');
      setLoading(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">회원탈퇴</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        탈퇴하면 같은 아이디로 다시 로그인하거나 가입할 수 없습니다.
      </ThemedText>
      <TextInput
        style={inputStyle}
        placeholder="현재 비밀번호"
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
        onSubmitEditing={onWithdraw}
      />
      {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={onWithdraw}
        style={({ pressed }) => [styles.button, styles.withdraw, (pressed || loading) && styles.pressed]}>
        <ThemedText style={styles.withdrawText}>{loading ? '탈퇴 중...' : '회원탈퇴'}</ThemedText>
      </Pressable>
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
    maxWidth: 600,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two + Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  withdraw: {
    borderWidth: 1,
    borderColor: '#e5484d',
  },
  withdrawText: {
    color: '#e5484d',
  },
});
