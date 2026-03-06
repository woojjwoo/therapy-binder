/**
 * Therapy Binder Design System — Colors
 * Warm, earthy palette designed to feel safe and grounded.
 */

export const Colors = {
  // Backgrounds
  cream: '#FAF6F0',
  creamDark: '#F0EAE0',

  // Primary
  earthBrown: '#5C4033',
  barkBrown: '#8B6A5A',

  // Mood scale
  sage: '#7DAF8F',         // 8–10 (calm)
  sageLight: '#A8C9B0',    // 6–7
  blush: '#E8B4A0',        // 4–5
  terracotta: '#C4634A',   // 1–3

  // UI
  border: '#DDD5C8',
  white: '#FFFFFF',
  overlay: 'rgba(92, 64, 51, 0.08)',
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
