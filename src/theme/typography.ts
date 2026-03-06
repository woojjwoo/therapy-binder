/**
 * Therapy Binder Typography
 * Playfair Display — insight text & headings
 * DM Sans — body text & UI labels
 *
 * Note: fonts loaded via expo-font in _layout.tsx
 */

export const Fonts = {
  serif: 'PlayfairDisplay_400Regular',
  serifBold: 'PlayfairDisplay_700Bold',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
} as const;

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 34,
} as const;
