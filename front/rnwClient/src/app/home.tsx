import { type Href, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Account, getAccounts } from '@/api/account';
import { type AccountBook, getAccountBooks } from '@/api/accountbook';
import { ApiError } from '@/api/client';
import { logout } from '@/api/member';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MENU: { label: string; href: Href }[] = [
  { label: '대시보드', href: '/dashboard' },
  { label: '마이페이지', href: '/mypage' },
  { label: '통장설정', href: '/account-settings' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<number>(); // undefined = 전체
  const [items, setItems] = useState<AccountBook[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Spring Security answers 403 for a missing or expired token.
  async function handleError(e: unknown) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      await logout();
      router.replace('/');
      return;
    }
    setError(e instanceof ApiError ? e.message : '서버에 연결할 수 없습니다.');
  }

  useEffect(() => {
    getAccounts().then(setAccounts).catch(handleError);
  }, []);

  useEffect(() => {
    let ignore = false; // drop responses for an account the user already switched away from
    getAccountBooks(0, accountId)
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
  }, [accountId]);

  function selectAccount(id: number | undefined) {
    if (id === accountId) return;
    setLoading(true);
    setError('');
    setAccountId(id);
  }

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await getAccountBooks(page + 1, accountId);
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
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="메뉴" hitSlop={8} onPress={() => setMenuOpen(true)}>
            <ThemedText type="subtitle">☰</ThemedText>
          </Pressable>
          <ThemedText type="smallBold">가계부</ThemedText>
        </ThemedView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipBar} contentContainerStyle={styles.chips}>
          {chips.map((c) => (
            <Pressable key={c.id ?? 'all'} accessibilityRole="button" accessibilityState={{ selected: c.id === accountId }} onPress={() => selectAccount(c.id)}>
              <ThemedView type={c.id === accountId ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
                <ThemedText type="small" themeColor={c.id === accountId ? 'text' : 'textSecondary'}>{c.name}</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </ScrollView>

        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

        <FlatList
          data={items}
          keyExtractor={(item) => String(item.accountBookId)}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            loading ? undefined : <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>작성된 가계부가 없습니다.</ThemedText>
          }
          ListFooterComponent={loading ? <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>불러오는 중...</ThemedText> : undefined}
          renderItem={({ item }) => (
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
          )}
        />

        {/* shortcut: write screen doesn't exist yet; wire router.push once it does */}
        <Pressable
          accessibilityRole="button"
          onPress={() => {}}
          style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, pressed && styles.pressed]}>
          <ThemedText style={{ color: theme.background }}>가계부 작성</ThemedText>
        </Pressable>
      </SafeAreaView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable accessibilityLabel="메뉴 닫기" style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          {/* inner Pressable swallows taps so only the backdrop closes the menu */}
          <Pressable style={[styles.drawer, { backgroundColor: theme.background }]}>
            <SafeAreaView style={styles.menu}>
              {MENU.map((m) => (
                <Pressable
                  key={m.label}
                  accessibilityRole="button"
                  onPress={() => {
                    setMenuOpen(false);
                    router.push(m.href);
                  }}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
                  <ThemedText>{m.label}</ThemedText>
                </Pressable>
              ))}
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipBar: {
    flexGrow: 0,
  },
  chips: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: 260,
    height: '100%',
  },
  menu: {
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
  },
  menuItem: {
    paddingVertical: Spacing.three,
  },
});
