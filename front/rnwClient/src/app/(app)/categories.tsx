import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authedErrorMessage } from '@/api/auth-error';
import { addCategory, type Category, deleteCategory, getCategories } from '@/api/category';
import { AppHeader } from '@/components/app-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CategoriesScreen() {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Every change reloads the list: the add API returns no id to insert locally.
  async function run(action?: () => Promise<unknown>) {
    setError('');
    try {
      await action?.();
      setCategories(await getCategories());
    } catch (e) {
      setError((await authedErrorMessage(e)) ?? '');
    }
  }

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(async (e) => setError((await authedErrorMessage(e)) ?? ''));
  }, []);

  function onAdd() {
    const trimmed = name.trim();
    if (!trimmed) return setError('카테고리 이름을 입력해주세요.');
    run(async () => {
      await addCategory(trimmed);
      setName('');
    });
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <AppHeader title="카테고리" />
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ThemedView style={styles.inline}>
          <TextInput
            style={[inputStyle, styles.inlineInput]}
            placeholder="새 카테고리 (예: 식비)"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            onSubmitEditing={onAdd}
          />
          <Pressable
            accessibilityRole="button"
            onPress={onAdd}
            style={({ pressed }) => [styles.addButton, { backgroundColor: theme.text }, pressed && styles.pressed]}>
            <ThemedText style={{ color: theme.background }}>추가</ThemedText>
          </Pressable>
        </ThemedView>

        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.categoryId)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              {categories ? '등록된 카테고리가 없습니다.' : '불러오는 중...'}
            </ThemedText>
          }
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText>{item.categoryName}</ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.categoryName} 삭제`}
                hitSlop={8}
                onPress={() => run(() => deleteCategory(item.categoryId))}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="small" style={styles.error}>삭제</ThemedText>
              </Pressable>
            </ThemedView>
          )}
        />
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
    padding: Spacing.three,
    gap: Spacing.three,
  },
  inline: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    height: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    fontSize: 16,
  },
  inlineInput: {
    flex: 1,
  },
  addButton: {
    height: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#e5484d',
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
