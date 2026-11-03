import { useState } from 'react';
import { FlatList, Modal, Pressable, type StyleProp, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import type { Category } from '@/api/category';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CategoryPickerProps = {
  categories: Category[];
  value: number[]; // selected categoryIds, empty = 전체
  onChange: (value: number[]) => void;
  style?: StyleProp<ViewStyle>;
};

// A field that opens a searchable multi-select list; the choice only applies on 적용, so the list isn't refetched per tap.
export function CategoryPicker({ categories, value, onChange, style }: CategoryPickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<number[]>([]);
  const [query, setQuery] = useState('');

  function openPicker() {
    setDraft(value);
    setQuery('');
    setOpen(true);
  }

  const toggle = (id: number) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  const names = categories.filter((c) => value.includes(c.categoryId)).map((c) => c.categoryName);
  const summary = names.length === 0 ? '카테고리 전체' : names.length <= 2 ? names.join(', ') : `${names[0]} 외 ${names.length - 1}개`;
  const shown = categories.filter((c) => c.categoryName.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`카테고리 선택, ${summary}`}
        onPress={openPicker}
        style={[styles.field, { backgroundColor: theme.backgroundElement }, style]}>
        <ThemedText type="small" themeColor={names.length ? 'text' : 'textSecondary'} numberOfLines={1}>
          {summary} ▾
        </ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="카테고리 선택 닫기" style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* inner Pressable swallows taps so only the backdrop closes the picker */}
          <Pressable style={[styles.panel, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.titleRow}>
              <ThemedText type="smallBold">카테고리 선택 ({draft.length})</ThemedText>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setDraft([])}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.underline}>선택 해제</ThemedText>
              </Pressable>
            </View>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="카테고리 검색"
              placeholderTextColor={theme.textSecondary}
              style={[styles.search, { color: theme.text, backgroundColor: theme.background }]}
            />

            <FlatList
              data={shown}
              keyExtractor={(c) => String(c.categoryId)}
              style={styles.list}
              ListEmptyComponent={
                <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                  {categories.length ? '검색 결과가 없습니다.' : '등록된 카테고리가 없습니다.'}
                </ThemedText>
              }
              renderItem={({ item }) => {
                const checked = draft.includes(item.categoryId);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    onPress={() => toggle(item.categoryId)}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                    <View style={[styles.box, { borderColor: theme.textSecondary }, checked && { backgroundColor: theme.text, borderColor: theme.text }]}>
                      {checked && <ThemedText type="smallBold" style={{ color: theme.background }}>✓</ThemedText>}
                    </View>
                    <ThemedText type="small">{item.categoryName}</ThemedText>
                  </Pressable>
                );
              }}
            />

            <Pressable
              accessibilityRole="button"
              onPress={apply}
              style={({ pressed }) => [styles.apply, { backgroundColor: theme.text }, pressed && styles.pressed]}>
              <ThemedText type="small" style={{ color: theme.background }}>적용</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 40,
    paddingHorizontal: Spacing.two + Spacing.one,
    borderRadius: Spacing.two,
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  panel: {
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  search: {
    height: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    fontSize: 16,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: Spacing.one,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  apply: {
    height: 44,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
