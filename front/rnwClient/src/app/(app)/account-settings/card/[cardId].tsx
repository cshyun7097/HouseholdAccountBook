import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { authedErrorMessage } from '@/api/auth-error';
import { type Card, deleteCard, getCards, payCard } from '@/api/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

export default function CardDetailScreen() {
  const theme = useTheme();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const [card, setCard] = useState<Card | null>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Alert buttons do nothing on web, so pay/delete confirm with a second tap
  const [confirm, setConfirm] = useState<'pay' | 'delete' | null>(null);

  useEffect(() => {
    // shortcut: no single-card API, so pick it out of the user's list; add GET /card/{id} if the list grows large
    getCards()
      .then((res) => setCard(res.find((c) => String(c.cardId) === cardId) ?? null))
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

  function onPay() {
    if (!card) return;
    if (confirm !== 'pay') return setConfirm('pay');
    run(async () => {
      await payCard(card.cardId);
      setCard({ ...card, debt: 0 });
      setConfirm(null);
    });
  }

  function onDelete() {
    if (!card) return;
    if (confirm !== 'delete') return setConfirm('delete');
    run(async () => {
      await deleteCard(card.cardId);
      router.dismissTo('/account-settings');
    });
  }

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

            {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}
            {confirm === 'pay' && (
              <ThemedText type="small" themeColor="textSecondary">
                {won(card.debt)}을 납부할까요? 납부 버튼을 한 번 더 누르면 부채가 0원이 됩니다.
              </ThemedText>
            )}
            {confirm === 'delete' && <ThemedText type="small" style={styles.error}>카드를 삭제할까요? 삭제 버튼을 한 번 더 누르면 삭제됩니다.</ThemedText>}

            <ThemedView style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={loading || card.debt === 0}
                onPress={onPay}
                style={({ pressed }) => [styles.button, styles.action, { backgroundColor: theme.text }, (pressed || loading || card.debt === 0) && styles.pressed]}>
                <ThemedText style={{ color: theme.background }}>
                  {card.debt === 0 ? '납부할 금액 없음' : confirm === 'pay' ? '한 번 더' : '납부'}
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={onDelete}
                style={({ pressed }) => [styles.button, styles.action, styles.delete, (pressed || loading) && styles.pressed]}>
                <ThemedText style={styles.deleteText}>{confirm === 'delete' ? '한 번 더' : '삭제'}</ThemedText>
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
