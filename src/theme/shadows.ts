import { Platform, type ViewStyle } from 'react-native';

function shadow(color: string, opacity: number, radius: number, offset: number, elevation: number): ViewStyle {
  return Platform.select({
    ios: { shadowColor: color, shadowOpacity: opacity, shadowRadius: radius, shadowOffset: { width: 0, height: offset } },
    android: { elevation, shadowColor: color },
    web: { boxShadow: `0 ${offset}px ${radius}px color-mix(in srgb, ${color} ${opacity * 100}%, transparent)` },
    default: {},
  }) as ViewStyle;
}

export const shadows = {
  ambient: shadow('#000000', 0.10, 24, 8, 6),
  panel: shadow('#000000', 0.06, 12, 4, 3),
  glowPrimary: shadow('#ff2600', 0.12, 18, 0, 4),
  glowSecondary: shadow('#494bd6', 0.12, 18, 0, 4),
};
