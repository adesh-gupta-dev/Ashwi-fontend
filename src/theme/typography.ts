import { Platform } from 'react-native';
import type { ThemeTypographyToken } from '../types/theme';

const nativeSans = 'Geist';
const nativeMono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as 'Menlo' | 'monospace';

export const fontFamilies = {
  body: nativeSans,
  headline: nativeSans,
  label: nativeSans,
  mono: nativeMono,
} as const;

export const typography = {
  displayLg: {
    fontFamily: nativeSans,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  displayLgMobile: {
    fontFamily: nativeSans,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headlineMd: {
    fontFamily: nativeSans,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.25,
  },
  bodyLg: {
    fontFamily: nativeSans,
    fontSize: 18,
    lineHeight: 29,
    fontWeight: '400',
  },
  bodyMd: {
    fontFamily: nativeSans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  labelSm: {
    fontFamily: nativeSans,
    fontSize: 12,
    lineHeight: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  code: {
    fontFamily: nativeMono,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
} satisfies Record<string, ThemeTypographyToken>;

