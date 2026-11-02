import { type Href, router, usePathname } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MENU: { label: string; href: Href & string }[] = [
  { label: '홈', href: '/home' },
  { label: '대시보드', href: '/dashboard' },
  { label: '통장설정', href: '/account-settings' },
  { label: '카테고리', href: '/categories' },
  { label: '마이페이지', href: '/mypage' },
];

// Header for home and every menu screen: ☰, title, optional right-side action.
// One component so the menu sits in the same spot everywhere. It handles the top safe area itself.
export function AppHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <SafeAreaView edges={['top']} style={styles.headerArea}>
      <View style={styles.header}>
        <MenuButton />
        <ThemedText type="smallBold">{title}</ThemedText>
        {right && <View style={styles.right}>{right}</View>}
      </View>
    </SafeAreaView>
  );
}

// The ☰ button and its slide-in menu.
function MenuButton() {
  const theme = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function go(href: Href & string) {
    setOpen(false);
    if (href === pathname) return;
    if (href === '/home') router.dismissTo('/home');
    // from home, push so back returns there; between menu screens, replace so the stack stays [home, one menu]
    else if (pathname === '/home') router.push(href);
    else router.replace(href);
  }

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="메뉴" hitSlop={8} onPress={() => setOpen(true)}>
        <ThemedText style={styles.icon}>☰</ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="메뉴 닫기" style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* inner Pressable swallows taps so only the backdrop closes the menu */}
          {/* element color, not background: in dark mode a black panel vanished into the dimmed black screen */}
          <Pressable style={[styles.drawer, { backgroundColor: theme.backgroundElement }]}>
            <SafeAreaView style={styles.menu}>
              {MENU.map((m) => {
                const current = m.href === pathname;
                return (
                  <Pressable
                    key={m.href}
                    accessibilityRole="button"
                    accessibilityState={{ selected: current }}
                    onPress={() => go(m.href)}
                    style={({ pressed }) => [styles.item, current && { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
                    <ThemedText type={current ? 'smallBold' : 'default'} style={current && styles.current}>
                      {m.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerArea: {
    width: '100%',
    alignItems: 'center',
  },
  // matches the screens' content column (600 wide, 16 side padding)
  header: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  right: {
    marginLeft: 'auto',
  },
  icon: {
    fontSize: 26,
    lineHeight: 32,
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
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  item: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  // keep the other items' size: smallBold alone would shrink the current one
  current: {
    fontSize: 16,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.7,
  },
});
