import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/providers/ThemeProvider';
import { componentTokens, typography, radii, shadows } from '@/theme';
import { triggerPress } from '@/services/haptics';
import Feather from '@expo/vector-icons/Feather';

type AppButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function AppButton({ label, onPress, variant = 'primary' }: AppButtonProps) {
  const { colors } = useTheme();
  const handlePress = () => {
    void triggerPress();
    onPress?.();
  };

  if (variant === 'primary') {
    return (
      <Pressable accessibilityRole="button" onPress={handlePress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        <LinearGradient colors={componentTokens.button.primaryGradient} style={styles.gradient}>
          <Text style={styles.primaryText}>{label}</Text>
          <Feather name="arrow-right" color="white" size={17} />
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [
        styles.outlined,
        {
          borderColor: colors.outlineVariant,
          backgroundColor: variant === 'secondary' ? colors.surfaceContainerLow : 'transparent',
        },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.secondaryText, { color: colors.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexShrink: 1,
    borderRadius: 28,
    overflow: 'hidden',
    minWidth: 132,
    ...shadows.glowPrimary,
  },
  gradient: {
    minHeight: componentTokens.button.height,
    paddingHorizontal: componentTokens.button.paddingHorizontal,
    borderRadius: 28,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
    fontWeight: typography.bodyMd.fontWeight,
    fontFamily: typography.bodyMd.fontFamily,
  },
  outlined: {
    flexShrink: 1,
    minHeight: componentTokens.button.height,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: componentTokens.button.paddingHorizontal,
    minWidth: 132,
  },
  secondaryText: {
    textAlign: 'center',
    fontSize: typography.bodyMd.fontSize,
    lineHeight: typography.bodyMd.lineHeight,
    fontWeight: typography.bodyMd.fontWeight,
    fontFamily: typography.bodyMd.fontFamily,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
