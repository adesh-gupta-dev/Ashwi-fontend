import { radii } from './radii';
import { spacing } from './spacing';

export const componentTokens = {
  button: {
    height: 48,
    radius: radii.lg,
    paddingHorizontal: spacing.lg,
    primaryGradient: ['#ff361f', '#ff2018'] as const,
    secondaryBorder: 'rgba(255, 255, 255, 0.08)',
  },
  card: {
    radius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  input: {
    height: 48,
    radius: radii.lg,
    horizontalPadding: spacing.md,
  },
  composer: {
    radius: radii.xl,
    minHeight: 64,
    maxHeight: 160,
  },
  sidebar: {
    widthDesktop: 280,
    collapsedWidth: 80,
  },
  header: {
    height: 64,
  },
  badge: {
    radius: radii.pill,
  },
} as const;

