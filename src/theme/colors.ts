/**
 * Therapy Binder Design System — Colors
 * Premium, calm, sophisticated palette.
 */

export const Colors = {
  // Backgrounds
  cream: '#FAFAF8',
  creamDark: '#F3F2EF',

  // Primary accent (forest green)
  accent: '#2D4A3E',
  // Secondary accent (warm brown)
  secondary: '#8B7355',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9E9E9E',

  // UI
  border: '#E8E6E1',
  white: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.06)',
  destructive: '#C0392B',

  // Mood scale
  sage: '#7DAF8F',         // 8–10 (calm)
  sageLight: '#A8C9B0',    // 6–7
  blush: '#E8B4A0',        // 4–5
  terracotta: '#C4634A',   // 1–3

  // Legacy aliases — map to new tokens for compat
  earthBrown: '#2D4A3E',
  barkBrown: '#6B6B6B',
} as const;

/**
 * Map a mood score (1–10) to its color.
 */
export function moodColor(score: number): string {
  if (score >= 8) return Colors.sage;
  if (score >= 6) return Colors.sageLight;
  if (score >= 4) return Colors.blush;
  return Colors.terracotta;
}
