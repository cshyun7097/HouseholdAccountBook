import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { type Dashboard, getDashboard } from '@/api/accountbook';
import { authedErrorMessage } from '@/api/auth-error';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChartColors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

const BAR_HEIGHT = 160;
const PIE_SIZE = 180;
const MAX_SLICES = 5; // more slices than this are unreadable; the rest fold into 기타

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
const monthLabel = (yyyyMM: string) => `${Number(yyyyMM.slice(5))}월`;

// Pie slice from angle a0 to a1 (radians, 0 = 12 o'clock, clockwise).
function slicePath(r: number, a0: number, a1: number) {
  const x = (a: number) => r + r * Math.sin(a);
  const y = (a: number) => r - r * Math.cos(a);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${r},${r} L${x(a0)},${y(a0)} A${r},${r} 0 ${large} 1 ${x(a1)},${y(a1)} Z`;
}

export default function DashboardScreen() {
  const theme = useTheme();
  const colors = ChartColors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [data, setData] = useState<Dashboard>();
  const [selected, setSelected] = useState<string>(); // month shown in the readout; undefined = latest
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      getDashboard()
        .then((res) => {
          setData(res);
          setError('');
        })
        .catch(async (e) => setError((await authedErrorMessage(e)) ?? ''));
    }, []),
  );

  if (!data) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ headerShown: true, title: '대시보드' }} />
        <ThemedText type="small" style={error ? styles.error : undefined} themeColor="textSecondary">
          {error || '불러오는 중...'}
        </ThemedText>
      </ThemedView>
    );
  }

  const maxBar = Math.max(1, ...data.monthly.flatMap((m) => [m.income, m.expense]));
  const readout = data.monthly.find((m) => m.month === selected) ?? data.monthly[data.monthly.length - 1];

  const top = data.categories.slice(0, MAX_SLICES);
  const rest = data.categories.slice(MAX_SLICES).reduce((sum, c) => sum + c.total, 0);
  const slices = [
    ...top.map((c, i) => ({ name: c.categoryName, total: c.total, color: colors.series[i] })),
    ...(rest > 0 ? [{ name: '기타', total: rest, color: colors.other }] : []),
  ];
  const expenseTotal = slices.reduce((sum, s) => sum + s.total, 0);
  let angle = 0;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: '대시보드' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {!!error && <ThemedText type="small" style={styles.error}>{error}</ThemedText>}

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">월별 수입·지출</ThemedText>
          <View style={styles.legend}>
            <LegendItem color={colors.income} label="수입" />
            <LegendItem color={colors.expense} label="지출" />
          </View>

          <View style={styles.bars}>
            {data.monthly.map((m) => {
              const isSelected = m.month === readout.month;
              return (
                <Pressable
                  key={m.month}
                  accessibilityRole="button"
                  accessibilityLabel={`${monthLabel(m.month)} 수입 ${won(m.income)}, 지출 ${won(m.expense)}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelected(m.month)}
                  style={styles.barColumn}>
                  <View style={[styles.barPair, isSelected && { backgroundColor: theme.backgroundSelected }]}>
                    <View style={[styles.bar, { height: (m.income / maxBar) * BAR_HEIGHT, backgroundColor: colors.income }]} />
                    <View style={[styles.bar, { height: (m.expense / maxBar) * BAR_HEIGHT, backgroundColor: colors.expense }]} />
                  </View>
                  <ThemedText type={isSelected ? 'smallBold' : 'small'} themeColor={isSelected ? 'text' : 'textSecondary'}>
                    {monthLabel(m.month)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.readout}>
            <ThemedText type="smallBold">{monthLabel(readout.month)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              수입 {won(readout.income)} · 지출 {won(readout.expense)}
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">{monthLabel(data.month)} 지출 카테고리</ThemedText>
          {expenseTotal === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              이번 달 지출 내역이 없습니다.
            </ThemedText>
          ) : (
            <>
              <View style={styles.pie}>
                <Svg width={PIE_SIZE} height={PIE_SIZE} accessibilityLabel="이번 달 카테고리별 지출 비율">
                  {slices.length === 1 ? (
                    // a single 360° arc collapses to nothing, so draw the full circle instead
                    <Circle cx={PIE_SIZE / 2} cy={PIE_SIZE / 2} r={PIE_SIZE / 2} fill={slices[0].color} />
                  ) : (
                    slices.map((s) => {
                      const a0 = angle;
                      angle += (s.total / expenseTotal) * 2 * Math.PI;
                      return (
                        // card-colored stroke = the 2px gap between slices
                        <Path key={s.name} d={slicePath(PIE_SIZE / 2, a0, angle)} fill={s.color} stroke={theme.backgroundElement} strokeWidth={2} />
                      );
                    })
                  )}
                </Svg>
              </View>

              {/* the table view: names, amounts and shares, so no slice relies on color alone */}
              <View style={styles.table}>
                {slices.map((s) => (
                  <View key={s.name} style={styles.tableRow}>
                    <LegendItem color={s.color} label={s.name} />
                    <ThemedText type="small" themeColor="textSecondary">
                      {won(s.total)} · {Math.round((s.total / expenseTotal) * 100)}%
                    </ThemedText>
                  </View>
                ))}
                <View style={[styles.tableRow, styles.totalRow, { borderTopColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold">합계</ThemedText>
                  <ThemedText type="smallBold">{won(expenseTotal)}</ThemedText>
                </View>
              </View>
            </>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <ThemedText type="small">{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // the centered container would otherwise shrink the ScrollView to its content's width on web
  scroll: {
    width: '100%',
    maxWidth: 600,
  },
  content: {
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
  legend: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  barPair: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.one,
  },
  bar: {
    width: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  readout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  pie: {
    alignItems: 'center',
  },
  table: {
    gap: Spacing.two,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
});
