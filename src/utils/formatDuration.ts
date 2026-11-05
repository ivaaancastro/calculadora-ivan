/**
 * Format a workout-level duration in minutes as "Xh Ym" or "Ym".
 * Ignores sub-minute precision (for header/summary displays).
 * Examples: 76 → "1h 16m", 45 → "45m", 60 → "1h"
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number | string): string {
  const m = Math.round(Number(minutes) || 0);
  if (m <= 0) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}

/**
 * Format a block/step-level duration (which can be fractional minutes storing seconds).
 * Shows seconds when there are sub-minute components.
 * Examples: 0.333 → "20s", 15 → "15m", 1.5 → "1m 30s", 0 → "0s"
 *
 * @param minutes - Duration in minutes (may be fractional)
 * @returns Formatted duration string
 */
export function formatBlockDuration(minutes: number | string): string {
  const totalSecs = Math.round((Number(minutes) || 0) * 60);
  if (totalSecs <= 0) return '0s';
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}
