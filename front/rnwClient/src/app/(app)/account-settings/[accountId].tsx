import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { type Account, deleteAccount, getAccounts, transfer, updateBalance } from '@/api/account';
import { authedErrorMessage } from '@/api/auth-error';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { onlyDigits, withCommas } from '@/utils/money';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function AccountDetailScreen() {
  const theme = useTheme();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const [account, setAccount] = useState<Account | null>();
  const [others, setOthers] = useState<Account[]>([]);
  const [mode, setMode] = useState<'balance' | 'transfer' | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [toAccountId, setToAccountId] = useState<number>();
  const [transferAmount, setTransferAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false); // Alert buttons do nothing on web, so confirm with a second tap

  useEffect(() => {
    // shortcut: no single-account API, so pick it out of the user's list; add GET /account/{id} if the list grows large
    getAccounts()
      .then((res) => {
        setAccount(res.find((a) => String(a.accountId) === accountId) ?? null);
        setOthers(res.filter((a) => String(a.accountId) !== accountId));
      })
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
      setMode(null);
      setNewBalance('');
    });
  }

  function onTransfer() {
    if (!account) return;
    const amount = Number(transferAmount);
    if (!toAccountId) return setError('받는 통장을 선택해주세요.');
    if (!Number.isSafeInteger(amount) || amount <= 0) return setError('이체 금액은 0보다 큰 숫자로 입력해주세요.');
    if (amount > account.balance) return setError('잔액이 부족합니다.');
    run(async () => {
      await transfer(account.accountId, toAccountId, amount);
      setAccount({ ...account, balance: account.balance - amount });
      setOthers(others.map((a) => (a.accountId === toAccountId ? { ...a, balance: a.balance + amount } : a)));
      setMode(null);
      setTransferAmount('');
      setToAccountId(undefined);
    });
  }

  function toggle(next: 'balance' | 'transfer') {
    setMode(mode === next ? null : next);
    setConfirmDelete(false);
    setError('');
  }

  function onDelete() {
    if (!account) return;
    if (!confirmDelete) return setConfirmDelete(true);
    run(async () => {
      await deleteAccount(account.accountId);
      router.dismissTo('/account-settings');
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

            {mode === 'balance' && (
              <ThemedView style={styles.edit}>
                <ThemedText type="small" themeColor="textSecondary">현재 금액: {won(account.balance)}</ThemedText>
                <TextInput
                  style={inputStyle}
                  placeholder="수정 금액"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  autoFocus
                  value={withCommas(newBalance)}
                  onChangeText={(text) => setNewBalance(onlyDigits(text))}
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

            {mode === 'transfer' && (
              <ThemedView style={styles.edit}>
                <ThemedText type="small" themeColor="textSecondary">보낼 수 있는 금액: {won(account.balance)}</ThemedText>
                <ThemedText type="smallBold">받는 통장</ThemedText>
                {others.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">이체할 다른 통장이 없습니다.</ThemedText>
                ) : (
                  <ThemedView style={styles.chips}>
                    {others.map((a) => (
                      <Chip key={a.accountId} label={a.accountName} selected={a.accountId === toAccountId} onPress={() => setToAccountId(a.accountId)} />
                    ))}
                  </ThemedView>
                )}
                <TextInput
                  style={inputStyle}
                  placeholder="이체 금액"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  value={withCommas(transferAmount)}
                  onChangeText={(text) => setTransferAmount(onlyDigits(text))}
                  onSubmitEditing={onTransfer}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={onTransfer}
                  style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, (pressed || loading) && styles.pressed]}>
                  <ThemedText style={{ color: theme.background }}>{loading ? '이체 중...' : '이체하기'}</ThemedText>
                </Pressable>
              </ThemedView>
            )}

            {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}
            {confirmDelete && <ThemedText type="small" style={styles.error}>통장을 삭제할까요? 삭제 버튼을 한 번 더 누르면 삭제됩니다.</ThemedText>}

            <ThemedView style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={() => toggle('balance')}
                style={({ pressed }) => [styles.button, styles.action, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
                <ThemedText>{mode === 'balance' ? '취소' : '잔액 수정'}</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={() => toggle('transfer')}
                style={({ pressed }) => [styles.button, styles.action, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
                <ThemedText>{mode === 'transfer' ? '취소' : '이체'}</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={onDelete}
                style={({ pressed }) => [styles.button, styles.action, styles.delete, (pressed || loading) && styles.pressed]}>
                <ThemedText style={styles.deleteText}>{confirmDelete ? '한 번 더' : '삭제'}</ThemedText>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
