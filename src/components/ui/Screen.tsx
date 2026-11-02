import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/ThemeProvider';
import { gradients, spacing } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { keyboardDismissMode } from '@/utils/platform';
import { AmbientBackground } from './AmbientBackground';

type ScreenProps = {
  children: React.ReactNode;
  padded?: boolean;
};

export function Screen({ children, padded = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const { horizontalPadding, maxContentWidth } = useResponsiveLayout();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={scheme === 'dark' ? gradients.background : gradients.backgroundLight} style={StyleSheet.absoluteFill} />
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (padded ? spacing.md : 0),
            paddingBottom: insets.bottom + spacing.xl,
            paddingLeft: insets.left + (padded ? horizontalPadding : 0),
            paddingRight: insets.right + (padded ? horizontalPadding : 0),
            width: '100%', maxWidth: padded ? maxContentWidth : undefined, alignSelf: 'center',
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={keyboardDismissMode}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flexGrow: 1,
    minWidth: 0,
  },
  glow: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.16,
  },
  glowTop: {
    top: -100,
    right: -80,
    width: 220,
    height: 220,
  },
  glowBottom: {
    left: -100,
    bottom: -120,
    width: 240,
    height: 240,
  },
  glowRight: {
    top: '34%',
    right: -120,
    width: 180,
    height: 180,
  },
});
