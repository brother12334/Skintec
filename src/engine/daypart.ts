import type { ThemeMode } from '../types';

/**
 * One definition of "is it morning or night" for the whole app, so the theme,
 * the header and the Today screen can never disagree.
 *
 * Daytime runs 05:00–17:59 local; the evening routine and the night theme take
 * over from 18:00.
 */
export const DAY_START_HOUR = 5;
export const NIGHT_START_HOUR = 18;

export type DayPart = 'am' | 'pm';

export function dayPart(hour: number): DayPart {
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? 'am' : 'pm';
}

export function resolveTheme(mode: ThemeMode, hour: number): 'day' | 'night' {
  if (mode === 'light') return 'day';
  if (mode === 'dark') return 'night';
  return dayPart(hour) === 'am' ? 'day' : 'night';
}
