import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { type Account, getAccounts } from '@/api/account';
import { type AccountBook, addAccountBook } from '@/api/accountbook';
import { authedErrorMessage } from '@/api/auth-error';
import { type Category, getCategories } from '@/api/category';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function WriteScreen() {
  const theme = useTheme();
  const [type, setType] = useState<AccountBook['type']>('EXPENSE');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [accounts, setAccounts] = useState<Account[]>();
  const [accountId, setAccountId] = useState<number>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number>();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function showError(e: unknown) {
    setError((await authedErrorMessage(e)) ?? '');
  }

  // Reload on focus, so accounts/categories added via the links below show up on return.
  useFocusEffect(
    useCallback(() => {
      getAccounts()
        .then((res) => {
          setAccounts(res);
          setAccountId((prev) => prev ?? res[0]?.accountId);
        })
        .catch(showError);
      getCategories().then(setCategories).catch(showError);
    }, []),
  );

  const selectedCategory = categories.find((c) => c.categoryId === categoryId);

  async function onSave() {
    const amount = Number(price);
    if (!content.trim() || !price) return setError('내용과 금액을 입력해주세요.');
    if (!Number.isSafeInteger(amount) || amount <= 0) return setError('금액은 0보다 큰 숫자로 입력해주세요.');
    if (!accountId) return setError('통장을 선택해주세요.');
    if (!categoryId) return setError('카테고리를 선택해주세요.');
    setError('');
    setLoading(true);
    try {
      await addAccountBook({ content: content.trim(), price: amount, type, accountId, categoryId });
      // dismissTo, not back: on web a reload empties the history and back has nowhere to go
      router.dismissTo('/home');
    } catch (e) {
      await showError(e);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: '가계부 작성' }} />
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.chips}>
          <Chip label="지출" selected={type === 'EXPENSE'} onPress={() => setType('EXPENSE')} />
          <Chip label="수입" selected={type === 'INCOME'} onPress={() => setType('INCOME')} />
        </ThemedView>

        <TextInput
          style={inputStyle}
          placeholder="내용 (예: 점심)"
          placeholderTextColor={theme.textSecondary}
          value={content}
          onChangeText={setContent}
        />
        <TextInput
          style={inputStyle}
          placeholder="금액"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={price}
          onChangeText={setPrice}
        />

        <ThemedText type="smallBold">통장</ThemedText>
        {accounts?.length === 0 ? (
          <Pressable accessibilityRole="link" onPress={() => router.push('/account-settings/add')}>
            <ThemedText type="linkPrimary">등록된 통장이 없습니다. 통장 추가하러 가기</ThemedText>
          </Pressable>
        ) : (
          <ThemedView style={styles.chips}>
            {accounts?.map((a) => (
              <Chip key={a.accountId} label={a.accountName} selected={a.accountId === accountId} onPress={() => setAccountId(a.accountId)} />
            ))}
          </ThemedView>
        )}

        <ThemedText type="smallBold">카테고리</ThemedText>
        {categories.length === 0 ? (
          <Pressable accessibilityRole="link" onPress={() => router.push('/categories')}>
            <ThemedText type="linkPrimary">등록된 카테고리가 없습니다. 카테고리 추가하러 가기</ThemedText>
          </Pressable>
        ) : (
          <ThemedView>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: categoryOpen }}
              onPress={() => setCategoryOpen(!categoryOpen)}
              style={[styles.input, styles.dropdown, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText themeColor={selectedCategory ? 'text' : 'textSecondary'}>
                {selectedCategory?.categoryName ?? '카테고리 선택'}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{categoryOpen ? '▲' : '▼'}</ThemedText>
            </Pressable>
            {categoryOpen && (
              <ThemedView type="backgroundElement" style={styles.options}>
                {categories.map((c) => (
                  <Pressable
                    key={c.categoryId}
                    accessibilityRole="button"
                    accessibilityState={{ selected: c.categoryId === categoryId }}
                    onPress={() => {
                      setCategoryId(c.categoryId);
                      setCategoryOpen(false);
                    }}
                    style={({ pressed }) => [styles.option, (pressed || c.categoryId === categoryId) && { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText>{c.categoryName}</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            )}
          </ThemedView>
        )}

        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={onSave}
          style={({ pressed }) => [styles.button, { backgroundColor: theme.text }, (pressed || loading) && styles.pressed]}>
          <ThemedText style={{ color: theme.background }}>{loading ? '저장 중...' : '저장하기'}</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 600,
    padding: Spacing.four,
    gap: Spacing.three,
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  options: {
    marginTop: Spacing.one,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
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
});
