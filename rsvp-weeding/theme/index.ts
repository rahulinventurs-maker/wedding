import { colors } from './colors';
import { fonts, fontSize, lineHeight, letterSpacing } from './typography';
import { spacing, radius } from './spacing';

export const theme = {
  colors,
  fonts,
  fontSize,
  lineHeight,
  letterSpacing,
  spacing,
  radius,
} as const;

export type Theme = typeof theme;

export { colors, fonts, fontSize, lineHeight, letterSpacing, spacing, radius };
