import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { componentTokens, radii, shadows } from '@/theme';

type AppCardProps = {
  children: React.ReactNode;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppCard({ children, elevated = false, style }: AppCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? colors.surfaceContainerHigh : colors.surfaceContainer,
          borderColor: colors.outlineVariant,
          ...(!elevated ? shadows.panel : shadows.ambient),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 0,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: componentTokens.card.padding,
    overflow: 'hidden',
  },
});
