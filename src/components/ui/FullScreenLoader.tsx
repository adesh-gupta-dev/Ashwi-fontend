import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { typography } from '@/theme';

type FullScreenLoaderProps = {
  label?: string;
};

export function FullScreenLoader({ label = 'Loading Ashwi...' }: FullScreenLoaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
      <Text
        style={{
          color: colors.onSurfaceVariant,
          marginTop: 12,
          fontFamily: typography.bodyMd.fontFamily,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

