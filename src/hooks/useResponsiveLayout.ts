import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

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
  const dimensions = useWindowDimensions();
  const [webLayoutReady, setWebLayoutReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') setWebLayoutReady(true);
  }, []);

  // React Native Web reports 0x0 dimensions while static HTML is rendered,
  // then the real viewport size as soon as the browser starts. Keep the first
  // browser render on the same compact layout as the server to avoid a
  // hydration mismatch; switch to the actual responsive layout after hydration.
  const { width, height, fontScale } = Platform.OS === 'web' && !webLayoutReady
    ? { width: 0, height: 0, fontScale: 1 }
    : dimensions;
  return { width, height, ...getResponsiveLayout(width, height, fontScale) };
}
