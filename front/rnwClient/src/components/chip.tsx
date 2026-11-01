import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = { label: string; selected: boolean; onPress: () => void };

export function Chip({ label, selected, onPress }: ChipProps) {
  const theme = useTheme();
  // Inverted colors + check mark: the theme's selected gray alone was too close to unselected to tell apart.
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}>
      <ThemedView type="backgroundElement" style={[styles.chip, selected && { backgroundColor: theme.text }]}>
        <ThemedText type={selected ? 'smallBold' : 'small'} style={selected ? { color: theme.background } : undefined} themeColor="textSecondary">
          {selected ? `✓ ${label}` : label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
