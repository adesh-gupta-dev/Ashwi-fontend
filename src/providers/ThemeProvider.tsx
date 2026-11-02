import React, { createContext, useEffect, useContext, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { vars } from 'nativewind';
import { darkColors, lightColors } from '../theme';
import type { ColorSchemeName, ThemeColors } from '../types/theme';
import { hydrateThemePreference, persistThemePreference } from '@/services/storage';
import { consoleTerminal } from '@/utils/consoleTerminal';

type ThemeContextValue = {
  scheme: ColorSchemeName;
  colors: ThemeColors;
  setScheme: (scheme: ColorSchemeName) => void;
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setScheme] = useState<ColorSchemeName>('dark');
  const [isHydrated, setIsHydrated] = useState(false);
  const scrollbarColors = scheme === 'dark' ? darkColors : lightColors;

  useEffect(() => {
    let cancelled = false;

    hydrateThemePreference()
      .then((storedScheme) => {
        if (cancelled) return;
        if (storedScheme) {
          setScheme(storedScheme);
        }
      })
      .catch((error) => {
        consoleTerminal('theme.hydrate', error, 'warn');
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    void persistThemePreference(scheme).catch((error) => consoleTerminal('theme.persist', error, 'warn'));
  }, [isHydrated, scheme]);

  const value = useMemo<ThemeContextValue>(() => {
    const colors = scheme === 'dark' ? darkColors : lightColors;

    return {
      scheme,
      colors,
      setScheme,
      toggleScheme: () => setScheme((current) => (current === 'dark' ? 'light' : 'dark')),
    };
  }, [scheme, isHydrated]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--ashwi-scroll-track', scrollbarColors.background);
    root.style.setProperty('--ashwi-scroll-thumb', scrollbarColors.outlineVariant);
    root.style.setProperty('--ashwi-scroll-hover', scrollbarColors.primary);
  }, [scrollbarColors]);

  const rgb = (hex: string) => `${parseInt(hex.slice(1, 3), 16)} ${parseInt(hex.slice(3, 5), 16)} ${parseInt(hex.slice(5, 7), 16)}`;
  const themeVariables = vars({
    '--canvas': rgb(value.colors.background), '--panel': rgb(value.colors.surfaceContainer),
    '--elevated': rgb(value.colors.surfaceContainerHigh), '--ink': rgb(value.colors.onSurface),
    '--muted': rgb(value.colors.onSurfaceVariant), '--line': rgb(value.colors.outlineVariant),
    '--brand': rgb(value.colors.primary),
  });
  return <ThemeContext.Provider value={value}><View className="flex-1 min-w-0" style={themeVariables}>{children}</View></ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    consoleTerminal('theme.provider-missing');
    return {
      scheme: 'light', colors: lightColors,
      setScheme: () => consoleTerminal('theme.set-unavailable'),
      toggleScheme: () => consoleTerminal('theme.toggle-unavailable'),
    } satisfies ThemeContextValue;
  }

  return context;
}
