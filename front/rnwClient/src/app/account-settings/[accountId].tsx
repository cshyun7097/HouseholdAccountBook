import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { type Account, deleteAccount, getAccounts, updateBalance } from '@/api/account';
import { authedErrorMessage } from '@/api/auth-error';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function AccountDetailScreen() {
  const theme = useTheme();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const [account, setAccount] = useState<Account | null>();
  const [editing, setEditing] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // shortcut: no single-account API, so pick it out of the user's list; add GET /account/{id} if the list grows large
    getAccounts()
      .then((res) => setAccount(res.find((a) => String(a.accountId) === accountId) ?? null))
      .catch(async (e) => setError((await authedErrorMessage(e)) ?? ''));
  }, [accountId]);

  async function run(action: () => Promise<void>) {
    setError('');
    setLoading(true);
    try {
      await action();
    } catch (e) {
      setError((await authedErrorMessage(e)) ?? '');
    } finally {
      setLoading(false);
    }
  }

  function onSaveBalance() {
    if (!account) return;
    const amount = Number(newBalance);
    if (!newBalance || !Number.isSafeInteger(amount)) return setError('수정 금액을 숫자로 입력해주세요.');
    run(async () => {
      await updateBalance(account.accountId, amount);
      setAccount({ ...account, balance: amount });
      setEditing(false);
      setNewBalance('');
    });
  }

  function onDelete() {
    if (!account) return;
    run(async () => {
      await deleteAccount(account.accountId);
      router.back();
    });
  }

  const rows: [string, string][] = account
    ? [
        ['통장 이름', account.accountName],
        ['은행', account.bankInfo],
        ['계좌번호', account.accountNumber],
        ['잔액', won(account.balance)],
      ]
    : [];

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: account?.accountName ?? '통장 상세' }} />
      <ThemedView style={styles.content}>
        {account === undefined && !error && <ThemedText type="small" themeColor="textSecondary">불러오는 중...</ThemedText>}
        {account === null && <ThemedText type="small" themeColor="textSecondary">통장을 찾을 수 없습니다.</ThemedText>}

        {account && (
          <>
            <ThemedView type="backgroundElement" style={styles.card}>
              {rows.map(([label, value]) => (
                <ThemedView key={label} type="backgroundElement" style={styles.row}>
                  <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
                  <ThemedText type="smallBold">{value}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            {editing && (
              <ThemedView style={styles.edit}>
                <ThemedText type="small" themeColor="textSecondary">현재 금액: {won(account.balance)}</ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="수정 금액"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  autoFocus
                  value={newBalance}
                  onChangeText={setNewBalance}
                  onSubmitEditing={onSaveBalance}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={onSaveBalance}
                  style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, (pressed || loading) && styles.pressed]}>
                  <ThemedText style={{ color: theme.background }}>{loading ? '저장 중...' : '수정완료'}</ThemedText>
                </Pressable>
              </ThemedView>
            )}

            {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

            <ThemedView style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={() => {
                  setEditing(!editing);
                  setError('');
                }}
                style={({ pressed }) => [styles.button, styles.action, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
                <ThemedText>{editing ? '취소' : '잔액 수정'}</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={onDelete}
                style={({ pressed }) => [styles.button, styles.action, styles.delete, (pressed || loading) && styles.pressed]}>
                <ThemedText style={styles.deleteText}>삭제</ThemedText>
              </Pressable>
            </ThemedView>
          </>
        )}

        {!account && !!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 600,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  error: {
    color: '#e5484d',
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  edit: {
    gap: Spacing.two,
  },
  input: {
    height: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
  button: {
    height: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delete: {
    backgroundColor: '#e5484d',
  },
  deleteText: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.7,
  },
});
