import type { Weekday } from '../types';

/** Indexed by `Date.getDay()`: 0 is Sunday. */
export const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/** Every day, in `Date.getDay()` order. */
export const ALL_DAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

/** The week as the app shows it, Monday first, since the routine is programmed around weekdays. */
export const WEEK_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export function isWeekday(value: unknown): value is Weekday {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6;
}

function shortNames(days: readonly Weekday[]): string[] {
  return WEEK_ORDER.filter((d) => days.includes(d)).map((d) => WEEKDAY_SHORT[d]);
}

/** "a", "a and b", "a, b and c". */
export function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)!}`;
}

/** "Every day", or the days in week order from Monday: "Mon, Wed, Fri". */
export function formatDays(days: readonly Weekday[]): string {
  return ALL_DAYS.every((d) => days.includes(d)) ? 'Every day' : shortNames(days).join(', ');
}

/** The days for use inside a sentence: "every day", or "Mon, Wed and Fri". */
export function daysPhrase(days: readonly Weekday[]): string {
  return ALL_DAYS.every((d) => days.includes(d)) ? 'every day' : joinAnd(shortNames(days));
}
