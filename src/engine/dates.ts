/** Small, timezone-safe date helpers. All dates are local-calendar ISO strings (YYYY-MM-DD). */

export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses YYYY-MM-DD as a local date (never UTC), so the app never drifts a day. */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map((n) => Number.parseInt(n, 10));
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

export function isValidISO(iso: string | undefined | null): boolean {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = fromISO(iso);
  return !Number.isNaN(d.getTime()) && toISO(d) === iso;
}

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Whole calendar days between two ISO dates (b - a). Safe across months, years and DST. */
export function daysBetween(a: string, b: string): number {
  const da = fromISO(a);
  const db = fromISO(b);
  const utcA = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const utcB = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

export function weekdayKey(iso: string): WeekdayKey {
  const jsDay = fromISO(iso).getDay(); // 0 = Sunday
  return WEEKDAY_KEYS[(jsDay + 6) % 7];
}

/** Monday that starts the week containing `iso`. */
export function startOfWeek(iso: string): string {
  const jsDay = fromISO(iso).getDay();
  return addDays(iso, -((jsDay + 6) % 7));
}

export function formatLongDate(iso: string): string {
  const d = fromISO(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDate(iso: string): string {
  const d = fromISO(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
