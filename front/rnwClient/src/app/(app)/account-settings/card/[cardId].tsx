import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { type Account, getAccounts } from '@/api/account';
import { authedErrorMessage } from '@/api/auth-error';
import { type Card, deleteCard, getCards, payCard } from '@/api/card';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { onlyDigits, withCommas } from '@/utils/money';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function CardDetailScreen() {
  const theme = useTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const [card, setCard] = useState<Card | null>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false); // Alert buttons do nothing on web, so confirm with a second tap
  const [paying, setPaying] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<number>();
  const [amount, setAmount] = useState('');

  useEffect(() => {
    // shortcut: no single-card API, so pick it out of the user's list; add GET /card/{id} if the list grows large
    getCards()
      .then((res) => setCard(res.find((c) => String(c.cardId) === cardId) ?? null))
      .catch(async (e) => setError((await authedErrorMessage(e)) ?? ''));
    getAccounts()
      .then((res) => {
        setAccounts(res);
        setAccountId(res[0]?.accountId);
      })
      .catch(async (e) => setError((await authedErrorMessage(e)) ?? ''));
  }, [cardId]);

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

  function togglePay() {
    if (!card) return;
    setPaying(!paying);
    setAmount(String(card.debt)); // full amount by default
    setConfirmDelete(false);
    setError('');
  }

  function onPay() {
    if (!card) return;
    const value = Number(amount);
    const account = accounts.find((a) => a.accountId === accountId);
    if (!account) return setError('납부할 통장을 선택해주세요.');
    if (!amount || !Number.isSafeInteger(value) || value <= 0) return setError('납부 금액은 0보다 큰 숫자로 입력해주세요.');
    if (value > card.debt) return setError('납부 금액이 부채보다 많습니다.');
    if (value > account.balance) return setError('잔액이 부족합니다.');
    run(async () => {
      await payCard(card.cardId, account.accountId, value);
      setCard({ ...card, debt: card.debt - value });
      setAccounts(accounts.map((a) => (a.accountId === account.accountId ? { ...a, balance: a.balance - value } : a)));
      setPaying(false);
    });
  }

  function onDelete() {
    if (!card) return;
    if (!confirmDelete) return setConfirmDelete(true);
    run(async () => {
      await deleteCard(card.cardId);
      router.dismissTo('/account-settings');
    });
  }

  const selectedAccount = accounts.find((a) => a.accountId === accountId);
  const rows: [string, string][] = card
    ? [
        ['카드 이름', card.cardName],
        ['카드사', card.cardCompany],
        ['부채 (미납 사용금)', won(card.debt)],
      ]
    : [];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: card?.cardName ?? '카드 상세' }} />
      <ThemedView style={styles.content}>
        {card === undefined && !error && <ThemedText type="small" themeColor="textSecondary">불러오는 중...</ThemedText>}
        {card === null && <ThemedText type="small" themeColor="textSecondary">카드를 찾을 수 없습니다.</ThemedText>}

        {card && (
          <>
            <ThemedView type="backgroundElement" style={styles.card}>
              {rows.map(([label, value]) => (
                <ThemedView key={label} type="backgroundElement" style={styles.row}>
                  <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
                  <ThemedText type="smallBold">{value}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            {paying && (
              <ThemedView style={styles.edit}>
                <ThemedText type="smallBold">납부할 통장</ThemedText>
                {accounts.length === 0 ? (
                  <Pressable accessibilityRole="link" onPress={() => router.push('/account-settings/add')}>
                    <ThemedText type="linkPrimary">등록된 통장이 없습니다. 통장 추가하러 가기</ThemedText>
                  </Pressable>
                ) : (
                  <ThemedView style={styles.chips}>
                    {accounts.map((a) => (
                      <Chip key={a.accountId} label={a.accountName} selected={a.accountId === accountId} onPress={() => setAccountId(a.accountId)} />
                    ))}
                  </ThemedView>
                )}
                {selectedAccount && (
                  <ThemedText type="small" themeColor="textSecondary">잔액: {won(selectedAccount.balance)}</ThemedText>
                )}
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  placeholder="납부 금액"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  value={withCommas(amount)}
                  onChangeText={(text) => setAmount(onlyDigits(text))}
                  onSubmitEditing={onPay}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={onPay}
                  style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, (pressed || loading) && styles.pressed]}>
                  <ThemedText style={{ color: theme.background }}>{loading ? '납부 중...' : '납부하기'}</ThemedText>
                </Pressable>
              </ThemedView>
            )}

            {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}
            {confirmDelete && <ThemedText type="small" style={styles.error}>카드를 삭제할까요? 삭제 버튼을 한 번 더 누르면 삭제됩니다.</ThemedText>}

            <ThemedView style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={loading || (card.debt <= 0 && !paying)}
                onPress={togglePay}
                style={({ pressed }) => [styles.button, styles.action, { backgroundColor: theme.backgroundElement }, (pressed || loading || (card.debt <= 0 && !paying)) && styles.pressed]}>
                <ThemedText>{paying ? '취소' : card.debt <= 0 ? '납부할 금액 없음' : '납부'}</ThemedText>
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

        {!card && !!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}
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
