import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

import { type Account, getAccounts } from '@/api/account';
import { type AccountBook, addAccountBook, deleteAccountBook, updateAccountBook } from '@/api/accountbook';
import { authedErrorMessage } from '@/api/auth-error';
import { type Card, getCards } from '@/api/card';
import { addCategory, type Category, getCategories } from '@/api/category';
import { Chip } from '@/components/chip';
import { DateField } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { today } from '@/utils/date';
import { onlyDigits, withCommas } from '@/utils/money';

type EditParams = { [K in keyof AccountBook]?: string };

// Opened with an entry's fields as params (from the home list) = edit mode.
export default function WriteScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<EditParams>();
  const editId = params.accountBookId ? Number(params.accountBookId) : undefined;
  const [type, setType] = useState<AccountBook['type']>(params.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
  const [content, setContent] = useState(params.content ?? '');
  const [price, setPrice] = useState(params.price ?? '');
  const [date, setDate] = useState(params.date ?? today());
  const [accounts, setAccounts] = useState<Account[]>();
  const [accountId, setAccountId] = useState(params.accountId ? Number(params.accountId) : undefined);
  const [paymentType, setPaymentType] = useState<AccountBook['paymentType']>(params.paymentType === 'CARD' ? 'CARD' : 'ACCOUNT');
  const [cards, setCards] = useState<Card[]>();
  const [cardId, setCardId] = useState(params.cardId ? Number(params.cardId) : undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState(params.categoryId ? Number(params.categoryId) : undefined);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<string>(); // undefined = the inline add field is closed
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false); // Alert buttons do nothing on web, so confirm with a second tap

  async function showError(e: unknown) {
    setError((await authedErrorMessage(e)) ?? '');
  }

  // Reload on focus, so accounts/cards added via the links below show up on return (the add screens go back here).
  useFocusEffect(
    useCallback(() => {
      getAccounts()
        .then((res) => {
          setAccounts(res);
          setAccountId((prev) => prev ?? res[0]?.accountId);
        })
        .catch(showError);
      getCards()
        .then((res) => {
          setCards(res);
          setCardId((prev) => prev ?? res[0]?.cardId);
        })
        .catch(showError);
      getCategories().then(setCategories).catch(showError);
    }, []),
  );

  const selectedCategory = categories.find((c) => c.categoryId === categoryId);

  async function run(action: () => Promise<unknown>) {
    setError('');
    setLoading(true);
    try {
      await action();
      // dismissTo, not back: on web a reload empties the history and back has nowhere to go
      router.dismissTo('/home');
    } catch (e) {
      await showError(e);
    } finally {
      setLoading(false);
    }
  }

  // Add a category right here, so the entry being written isn't lost by leaving the screen
  async function onAddCategory() {
    const name = newCategory?.trim();
    if (!name) return setError('카테고리 이름을 입력해주세요.');
    setError('');
    try {
      await addCategory(name);
      // the add API returns no id, so reload and pick the new one by name
      const res = await getCategories();
      setCategories(res);
      setCategoryId(res.find((c) => c.categoryName === name)?.categoryId);
      setNewCategory(undefined);
    } catch (e) {
      await showError(e);
    }
  }

  async function onSave() {
    const amount = Number(price);
    if (!content.trim() || !price) return setError('내용과 금액을 입력해주세요.');
    if (!Number.isSafeInteger(amount) || amount <= 0) return setError('금액은 0보다 큰 숫자로 입력해주세요.');
    if (paymentType === 'ACCOUNT' && !accountId) return setError('통장을 선택해주세요.');
    if (paymentType === 'CARD' && !cardId) return setError('카드를 선택해주세요.');
    if (!categoryId) return setError('카테고리를 선택해주세요.');
    const data = { content: content.trim(), price: amount, type, categoryId };
    await run(() => (editId ? updateAccountBook(editId, data) : addAccountBook({ ...data, paymentType, date, ...(paymentType === 'CARD' ? { cardId } : { accountId }) })));
  }

  function onDelete() {
    if (!editId) return;
    if (!confirmDelete) return setConfirmDelete(true);
    run(() => deleteAccountBook(editId));
  }

  const selectedAccount = accounts?.find((a) => a.accountId === accountId);
  const selectedCard = cards?.find((c) => c.cardId === cardId);
  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: editId ? '가계부 수정' : '가계부 작성' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
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
          value={withCommas(price)}
          onChangeText={(text) => setPrice(onlyDigits(text))}
        />

        <ThemedText type="smallBold">날짜</ThemedText>
        {editId ? (
          <ThemedText themeColor="textSecondary">{date}</ThemedText>
        ) : (
          <DateField label="날짜" value={date} onChange={setDate} style={styles.dateField} />
        )}

        <ThemedText type="smallBold">결제수단</ThemedText>
        {editId ? (
          <ThemedText themeColor="textSecondary">
            {paymentType === 'CARD' ? `카드 · ${selectedCard?.cardName ?? '-'}` : `통장 · ${selectedAccount?.accountName ?? '-'}`}
          </ThemedText>
        ) : (
          <>
            <ThemedView style={styles.chips}>
              <Chip label="통장" selected={paymentType === 'ACCOUNT'} onPress={() => setPaymentType('ACCOUNT')} />
              <Chip label="카드" selected={paymentType === 'CARD'} onPress={() => setPaymentType('CARD')} />
            </ThemedView>
            {paymentType === 'ACCOUNT' ? (
              accounts?.length === 0 ? (
                <Pressable accessibilityRole="link" onPress={() => router.push('/account-settings/add')}>
                  <ThemedText type="linkPrimary">등록된 통장이 없습니다. 통장 추가하러 가기</ThemedText>
                </Pressable>
              ) : (
                <ThemedView style={styles.chips}>
                  {accounts?.map((a) => (
                    <Chip key={a.accountId} label={a.accountName} selected={a.accountId === accountId} onPress={() => setAccountId(a.accountId)} />
                  ))}
                </ThemedView>
              )
            ) : cards?.length === 0 ? (
              <Pressable accessibilityRole="link" onPress={() => router.push('/account-settings/card/add')}>
                <ThemedText type="linkPrimary">등록된 카드가 없습니다. 카드 추가하러 가기</ThemedText>
              </Pressable>
            ) : (
              <ThemedView style={styles.chips}>
                {cards?.map((c) => (
                  <Chip key={c.cardId} label={c.cardName} selected={c.cardId === cardId} onPress={() => setCardId(c.cardId)} />
                ))}
              </ThemedView>
            )}
          </>
        )}
        {paymentType === 'ACCOUNT' && selectedAccount && (
          <ThemedText type="small" themeColor="textSecondary">잔액: {selectedAccount.balance.toLocaleString('ko-KR')}원</ThemedText>
        )}
        {paymentType === 'CARD' && selectedCard && (
          <ThemedText type="small" themeColor="textSecondary">부채: {selectedCard.debt.toLocaleString('ko-KR')}원</ThemedText>
        )}

        <ThemedText type="smallBold">카테고리</ThemedText>
        {categories.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">등록된 카테고리가 없습니다. 바로 추가해주세요.</ThemedText>
        )}
        {categories.length === 0 || newCategory !== undefined ? (
          <ThemedView style={styles.inline}>
            <TextInput
              style={[inputStyle, styles.inlineInput]}
              placeholder="새 카테고리 (예: 식비)"
              placeholderTextColor={theme.textSecondary}
              value={newCategory ?? ''}
              onChangeText={setNewCategory}
              onSubmitEditing={onAddCategory}
            />
            <Pressable
              accessibilityRole="button"
              onPress={onAddCategory}
              style={({ pressed }) => [styles.addButton, { backgroundColor: theme.text }, pressed && styles.pressed]}>
              <ThemedText style={{ color: theme.background }}>추가</ThemedText>
            </Pressable>
            {categories.length > 0 && (
              <Pressable accessibilityRole="button" onPress={() => setNewCategory(undefined)} style={[styles.addButton, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText>취소</ThemedText>
              </Pressable>
            )}
          </ThemedView>
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
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setNewCategory('');
                    setCategoryOpen(false);
                  }}
                  style={({ pressed }) => [styles.option, pressed && { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText themeColor="textSecondary">+ 새 카테고리 추가</ThemedText>
                </Pressable>
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
        {!!editId && (
          <>
            <ThemedText type="small" themeColor="textSecondary">날짜와 결제수단은 수정할 수 없습니다. 바꾸려면 삭제 후 다시 작성해주세요.</ThemedText>
            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={onDelete}
              style={({ pressed }) => [styles.button, styles.delete, (pressed || loading) && styles.pressed]}>
              <ThemedText style={styles.deleteText}>{confirmDelete ? '정말 삭제할까요? 한 번 더 누르면 삭제됩니다' : '삭제하기'}</ThemedText>
            </Pressable>
          </>
        )}
      </ScrollView>
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
  form: {
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
  inline: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  inlineInput: {
    flex: 1,
  },
  addButton: {
    height: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateField: {
    height: 48, // match the other inputs on this screen
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
  delete: {
    borderWidth: 1,
    borderColor: '#e5484d',
  },
  deleteText: {
    color: '#e5484d',
  },
});
