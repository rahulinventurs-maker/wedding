/**
 * Font pairing:
 *   Display / Headings  →  Cormorant Garamond  (luxury serif — install via react-native-fonts or manually)
 *   Body / UI           →  Inter               (clean, modern — install via expo-font or manually)
 *
 * Install:
 *   Place font files in assets/fonts/ and link via react-native.config.js
 */

export const fonts = {
  display: {
    regular: 'CormorantGaramond-Regular',
    medium: 'CormorantGaramond-Medium',
    semiBold: 'CormorantGaramond-SemiBold',
    bold: 'CormorantGaramond-Bold',
    italic: 'CormorantGaramond-Italic',
  },
  body: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
} as const;

export type Fonts = typeof fonts;
