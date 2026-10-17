import { localDay, parseDay } from '../state/log';
import type { Feeling, LogEntry } from '../types';
import { esc } from './dom';

/** A feeling, `done` for an entry without one, or `empty` for no entry. */
export type DayState = Feeling | 'done' | 'empty';

export interface DayCell {
  date: string;
  initial: string;
  today: boolean;
  state: DayState;
}

const INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const STATE_NAMES: Record<DayState, string> = {
  strong: 'strong',
  ok: 'OK',
  strained: 'strained',
  done: 'done, no note',
  empty: 'not done',
};
const SHORT_DATE: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };

/** The day's latest feeling, `done` if it has entries but no feeling, `empty` if none. */
export function dayState(entries: readonly LogEntry[], date: string): DayState {
  const onDay = entries.filter((e) => e.date === date);
  if (onDay.length === 0) return 'empty';
  return onDay.filter((e) => e.feeling).at(-1)?.feeling ?? 'done';
}

/** Seven days, oldest first, ending today. */
export function dayCells(entries: readonly LogEntry[], now = new Date()): DayCell[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
    const date = localDay(day);
    return { date, initial: INITIALS[day.getDay()]!, today: i === 6, state: dayState(entries, date) };
  });
}

export function cellLabel(cell: DayCell): string {
  const day = parseDay(cell.date)?.toLocaleDateString(undefined, SHORT_DATE) ?? cell.date;
  return `${day}${cell.today ? ' (today)' : ''}: ${STATE_NAMES[cell.state]}`;
}

export function dayStrip(entries: readonly LogEntry[], now = new Date()): string {
  const cells = dayCells(entries, now).map(
    (cell) => `<li class="day${cell.today ? ' today' : ''}"${cell.today ? ' aria-current="date"' : ''}>
      <span class="day-initial" aria-hidden="true">${cell.initial}</span>
      <span class="day-dot ${cell.state}" aria-hidden="true"></span>
      <span class="visually-hidden">${esc(cellLabel(cell))}</span>
    </li>`,
  );
  return `<ol class="day-strip" aria-label="Last 7 days">${cells.join('')}</ol>`;
}
