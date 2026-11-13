import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Account, getAccounts } from '@/api/account';
import { authedErrorMessage } from '@/api/auth-error';
import { type Card, getCards } from '@/api/card';
import { AppHeader } from '@/components/app-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

type RowProps = { title: string; sub: string; amount: string; amountStyle?: TextStyle; onPress: () => void };

function Row({ title, sub, amount, amountStyle, onPress }: RowProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <ThemedView type="backgroundElement" style={styles.rowText}>
          <ThemedText>{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{sub}</ThemedText>
        </ThemedView>
        <ThemedText type="smallBold" style={amountStyle}>{amount}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function AccountSettingsScreen() {
  const theme = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Reload whenever the screen regains focus, so a newly added account or card shows up on return.
  useFocusEffect(
    useCallback(() => {
      let ignore = false;
      Promise.all([getAccounts(), getCards()])
        .then(([accountRes, cardRes]) => {
          if (ignore) return;
          setAccounts(accountRes);
          setCards(cardRes);
          setError('');
        })
        .catch(async (e) => {
          const message = await authedErrorMessage(e);
          if (!ignore) setError(message ?? '');
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
      return () => {
        ignore = true;
      };
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <AppHeader title="통장 및 카드 관리" />
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        {/* the list APIs already return every balance and debt, so the totals need no backend call */}
        <ThemedView style={styles.totals}>
          <ThemedView type="backgroundElement" style={styles.total}>
            <ThemedText type="small" themeColor="textSecondary">총 잔액</ThemedText>
            <ThemedText type="subtitle">{loading ? '-' : won(accounts.reduce((sum, a) => sum + a.balance, 0))}</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.total}>
            <ThemedText type="small" themeColor="textSecondary">부채 (카드 사용금)</ThemedText>
            <ThemedText type="subtitle" style={styles.debt}>{loading ? '-' : won(cards.reduce((sum, c) => sum + c.debt, 0))}</ThemedText>
          </ThemedView>
        </ThemedView>

        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

        <ScrollView contentContainerStyle={styles.list}>
          <ThemedText type="smallBold">통장</ThemedText>
          {accounts.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              {loading ? '불러오는 중...' : '등록된 통장이 없습니다.'}
            </ThemedText>
          )}
          {accounts.map((item) => (
            <Row
              key={item.accountId}
              title={item.accountName}
              sub={`${item.bankInfo} ${item.accountNumber}`}
              amount={won(item.balance)}
              onPress={() => router.push({ pathname: '/account-settings/[accountId]', params: { accountId: item.accountId } })}
            />
          ))}

          <ThemedText type="smallBold" style={styles.section}>카드</ThemedText>
          {cards.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              {loading ? '불러오는 중...' : '등록된 카드가 없습니다.'}
            </ThemedText>
          )}
          {cards.map((item) => (
            <Row
              key={item.cardId}
              title={item.cardName}
              sub={item.cardCompany}
              amount={won(item.debt)}
              amountStyle={styles.debt}
              onPress={() => router.push({ pathname: '/account-settings/card/[cardId]', params: { cardId: item.cardId } })}
            />
          ))}
        </ScrollView>

        <ThemedView style={styles.buttons}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/account-settings/add')}
            style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, pressed && styles.pressed]}>
            <ThemedText style={{ color: theme.background }}>통장 추가</ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/account-settings/card/add')}
            style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, pressed && styles.pressed]}>
            <ThemedText style={{ color: theme.background }}>카드 추가</ThemedText>
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
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  totals: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  total: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  error: {
    color: '#e5484d',
    paddingTop: Spacing.two,
  },
  list: {
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  rowText: {
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  section: {
    marginTop: Spacing.three,
  },
  debt: {
    color: '#e5484d',
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
