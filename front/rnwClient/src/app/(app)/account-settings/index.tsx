import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Account, getAccounts } from '@/api/account';
import { authedErrorMessage } from '@/api/auth-error';
import { AppHeader } from '@/components/app-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AccountSettingsScreen() {
  const theme = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Reload whenever the screen regains focus, so a newly added account shows up on return.
  useFocusEffect(
    useCallback(() => {
      let ignore = false;
      getAccounts()
        .then((res) => {
          if (ignore) return;
          setAccounts(res);
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
      <AppHeader title="통장설정" />
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        {/* the list API already returns every balance, so the total needs no backend call */}
        <ThemedView type="backgroundElement" style={styles.total}>
          <ThemedText type="small" themeColor="textSecondary">총 잔액</ThemedText>
          <ThemedText type="subtitle">
            {loading ? '-' : `${accounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString('ko-KR')}원`}
          </ThemedText>
        </ThemedView>

        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

        <FlatList
          data={accounts}
          keyExtractor={(item) => String(item.accountId)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              {loading ? '불러오는 중...' : '등록된 통장이 없습니다.'}
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/account-settings/[accountId]', params: { accountId: item.accountId } })}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.row}>
                <ThemedView type="backgroundElement" style={styles.rowText}>
                  <ThemedText>{item.accountName}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.bankInfo} {item.accountNumber}
                  </ThemedText>
                </ThemedView>
                <ThemedText type="smallBold">{item.balance.toLocaleString('ko-KR')}원</ThemedText>
              </ThemedView>
            </Pressable>
          )}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/account-settings/add')}
          style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, pressed && styles.pressed]}>
          <ThemedText style={{ color: theme.background }}>통장 추가</ThemedText>
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
  total: {
    marginTop: Spacing.three,
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
