import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Account, getAccounts } from '@/api/account';
import { type AccountBook, type DateRange, getAccountBooks } from '@/api/accountbook';
import { authedErrorMessage } from '@/api/auth-error';
import { type Category, getCategories } from '@/api/category';
import { logout } from '@/api/member';
import { AppHeader } from '@/components/app-menu';
import { CategoryPicker } from '@/components/category-picker';
import { Chip } from '@/components/chip';
import { DateField } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addMonths } from '@/utils/date';

export default function HomeScreen() {
  const theme = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<number>(); // undefined = 전체
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryIds, setCategoryIds] = useState<number[]>([]); // empty = 전체
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [range, setRange] = useState<DateRange>(); // undefined = all dates
  const [items, setItems] = useState<AccountBook[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function handleError(e: unknown) {
    setError((await authedErrorMessage(e)) ?? '');
  }

  // Reload on focus too, so entries and accounts added on other screens show up on return.
  useFocusEffect(
    useCallback(() => {
      getAccounts().then(setAccounts).catch(handleError);
      getCategories().then(setCategories).catch(handleError);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let ignore = false; // drop responses for a filter the user already switched away from
      getAccountBooks(0, accountId, range, categoryIds)
        .then((res) => {
          if (ignore) return;
          setItems(res.content);
          setPage(0);
          setHasMore(res.page.totalPages > 1);
        })
        .catch((e) => {
          if (!ignore) handleError(e);
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
      return () => {
        ignore = true;
      };
    }, [accountId, range, categoryIds]),
  );

  function selectAccount(id: number | undefined) {
    if (id === accountId) return;
    setLoading(true);
    setError('');
    setAccountId(id);
  }

  function selectCategories(ids: number[]) {
    if (ids.length === categoryIds.length && ids.every((id) => categoryIds.includes(id))) return;
    setLoading(true);
    setError('');
    setCategoryIds(ids);
  }

  function applyRange() {
    if (!startDate || !endDate) return setError('시작일과 종료일을 선택해주세요.');
    if (startDate > endDate) return setError('시작일이 종료일보다 늦습니다.');
    // same rule as the backend: the end may be at most one month after the start
    if (endDate > addMonths(startDate, 1)) return setError(`조회 기간은 최대 1개월입니다. (${addMonths(startDate, 1)}까지 선택할 수 있어요)`);
    setLoading(true);
    setError('');
    setRange({ startDate, endDate });
  }

  function clearRange() {
    setStartDate(undefined);
    setEndDate(undefined);
    setError('');
    if (!range) return;
    setLoading(true);
    setRange(undefined);
  }

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await getAccountBooks(page + 1, accountId, range, categoryIds);
      setItems((prev) => [...prev, ...res.content]);
      setPage(res.page.number);
      setHasMore(res.page.number + 1 < res.page.totalPages);
    } catch (e) {
      await handleError(e);
    } finally {
      setLoading(false);
    }
  }

  const chips = [{ id: undefined, name: '전체' }, ...accounts.map((a) => ({ id: a.accountId, name: a.accountName }))];

  return (
    <ThemedView style={styles.container}>
      <AppHeader
        title="가계부"
        right={
          // clearing the token is enough: the root layout's guard then sends the user to login
          <Pressable accessibilityRole="button" hitSlop={8} onPress={logout} style={({ pressed }) => pressed && styles.pressed}>
            <ThemedText type="small" themeColor="textSecondary">로그아웃</ThemedText>
          </Pressable>
        }
      />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipBar} contentContainerStyle={styles.chips}>
          {chips.map((c) => (
            <Chip key={c.id ?? 'all'} label={c.name} selected={c.id === accountId} onPress={() => selectAccount(c.id)} />
          ))}
        </ScrollView>

        <CategoryPicker categories={categories} value={categoryIds} onChange={selectCategories} style={styles.categoryPicker} />

        <ThemedView style={styles.dateRow}>
          <DateField label="시작일" value={startDate} onChange={setStartDate} style={styles.dateInput} />
          <ThemedText type="small" themeColor="textSecondary">~</ThemedText>
          <DateField label="종료일" value={endDate} onChange={setEndDate} style={styles.dateInput} />
          <Pressable
            accessibilityRole="button"
            onPress={applyRange}
            style={({ pressed }) => [styles.dateButton, { backgroundColor: theme.text }, pressed && styles.pressed]}>
            <ThemedText type="small" style={{ color: theme.background }}>조회</ThemedText>
          </Pressable>
        </ThemedView>
        {range && (
          <ThemedView style={styles.rangeRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {range.startDate} ~ {range.endDate}
            </ThemedText>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={clearRange}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.underline}>초기화</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

        <FlatList
          data={items}
          keyExtractor={(item) => String(item.accountBookId)}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            loading ? undefined : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {range || categoryIds.length ? '조건에 맞는 가계부가 없습니다.' : '작성된 가계부가 없습니다.'}
              </ThemedText>
            )
          }
          ListFooterComponent={loading ? <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>불러오는 중...</ThemedText> : undefined}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityHint="수정 또는 삭제"
              // there is no single-entry API, so the entry travels to the edit screen as params
              onPress={() => router.push({ pathname: '/write', params: Object.fromEntries(Object.entries(item).filter(([, v]) => v != null)) })}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.row}>
                <ThemedView type="backgroundElement" style={styles.rowText}>
                  <ThemedText>{item.content}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.date} · {item.categoryName}
                  </ThemedText>
                </ThemedView>
                <ThemedText type="smallBold" style={{ color: item.type === 'INCOME' ? '#3c87f7' : '#e5484d' }}>
                  {item.type === 'INCOME' ? '+' : '-'}
                  {item.price.toLocaleString('ko-KR')}원
                </ThemedText>
              </ThemedView>
            </Pressable>
          )}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/write')}
          style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, pressed && styles.pressed]}>
          <ThemedText style={{ color: theme.background }}>가계부 작성</ThemedText>
        </Pressable>
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
  categoryPicker: {
    marginBottom: Spacing.two,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  dateInput: {
    flex: 1,
    minWidth: 0, // let both fields shrink on narrow phones instead of pushing the button off-screen
  },
  dateButton: {
    height: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  chipBar: {
    flexGrow: 0,
  },
  chips: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  error: {
    color: '#e5484d',
  },
  list: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
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
    paddingVertical: Spacing.four,
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
});
