import { useState } from 'react';
import { Modal, Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toIsoDate, today } from '@/utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type DateFieldProps = {
  label: string; // placeholder and accessibility name
  value?: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

// A field that opens a month calendar; tapping a day picks it. Same on web, iOS and Android.
export function DateField({ label, value, onChange, style }: DateFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState({ year: 0, month: 0 }); // month on screen in the calendar

  function openCalendar() {
    const [y, m] = (value ?? today()).split('-').map(Number);
    setShown({ year: y, month: m - 1 });
    setOpen(true);
  }

  // Date normalizes month -1 / 12 into the neighbouring year
  const moveMonth = (delta: number) => {
    const d = new Date(shown.year, shown.month + delta, 1);
    setShown({ year: d.getFullYear(), month: d.getMonth() });
  };

  const firstWeekday = new Date(shown.year, shown.month, 1).getDay();
  const daysInMonth = new Date(shown.year, shown.month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayIso = today();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `${label} ${value}` : label}
        onPress={openCalendar}
        style={[styles.field, { backgroundColor: theme.backgroundElement }, style]}>
        <ThemedText type="small" themeColor={value ? 'text' : 'textSecondary'} numberOfLines={1}>
          {value ?? label}
        </ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="달력 닫기" style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* inner Pressable swallows taps so only the backdrop closes the calendar */}
          {/* element color, not background: in dark mode a black panel vanished into the dimmed black screen */}
          <Pressable style={[styles.calendar, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.monthRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="이전 달" hitSlop={12} onPress={() => moveMonth(-1)}>
                <ThemedText type="subtitle">‹</ThemedText>
              </Pressable>
              <ThemedText type="smallBold">
                {shown.year}년 {shown.month + 1}월
              </ThemedText>
              <Pressable accessibilityRole="button" accessibilityLabel="다음 달" hitSlop={12} onPress={() => moveMonth(1)}>
                <ThemedText type="subtitle">›</ThemedText>
              </Pressable>
            </View>

            <View style={styles.grid}>
              {WEEKDAYS.map((w) => (
                <View key={w} style={styles.cell}>
                  <ThemedText type="small" themeColor="textSecondary">{w}</ThemedText>
                </View>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <View key={`blank-${i}`} style={styles.cell} />;
                const iso = toIsoDate(shown.year, shown.month, day);
                const selected = iso === value;
                return (
                  <Pressable
                    key={iso}
                    accessibilityRole="button"
                    accessibilityLabel={iso}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    style={styles.cell}>
                    <View
                      style={[
                        styles.day,
                        selected && { backgroundColor: theme.text },
                        !selected && iso === todayIso && { borderWidth: 1, borderColor: theme.textSecondary },
                      ]}>
                      <ThemedText type={selected ? 'smallBold' : 'small'} style={selected ? { color: theme.background } : undefined}>
                        {day}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
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
  calendar: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
