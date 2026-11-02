import { useWindowDimensions } from 'react-native';

export function getResponsiveLayout(width: number, height: number, fontScale = 1) {
  // Respect enlarged text before choosing a multi-column layout.
  const contentWidth = width / Math.max(fontScale, 1);
  return {
    isCompact: contentWidth < 600,
    isWide: contentWidth >= 960,
    isShort: height < 600,
    horizontalPadding: width < 360 ? 12 : contentWidth < 600 ? 16 : 24,
    maxContentWidth: 1320,
  };
}

export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  return { width, height, ...getResponsiveLayout(width, height, fontScale) };
}
