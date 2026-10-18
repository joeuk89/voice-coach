import type { Feeling, LogEntry } from '../types';
import { isFiniteNumber, isRecord, read, write } from './storage';

const KEY = 'log';
const MAX_ENTRIES = 400;
const FEELINGS: readonly Feeling[] = ['strong', 'ok', 'strained'];

export function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Local midnight of a YYYY-MM-DD day, or null if it is not a real calendar date. */
export function parseDay(day: string): Date | null {
  const match = DAY.exec(day);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return localDay(d) === day ? d : null;
}

function isFeeling(value: unknown): value is Feeling {
  return FEELINGS.some((f) => f === value);
}

function toEntry(value: unknown): LogEntry | null {
  if (!isRecord(value)) return null;
  const { date, completedAt, routine, totalSec, steps, feeling } = value;
  if (typeof date !== 'string' || typeof completedAt !== 'string' || !isFiniteNumber(totalSec)) return null;
  if (!parseDay(date) || Number.isNaN(Date.parse(completedAt))) return null;
  if (routine !== 'short' && routine !== 'full') return null;
  const entry: LogEntry = { date, completedAt, routine, totalSec };
  if (Number.isInteger(steps) && (steps as number) > 0) entry.steps = steps as number;
  if (isFeeling(feeling)) entry.feeling = feeling;
  return entry;
}

export function loadLog(): LogEntry[] {
  const raw = read(KEY);
  if (!Array.isArray(raw)) return [];
  return raw.map(toEntry).filter((entry) => entry !== null);
}

/** False when the entry could not be saved. */
export function appendLog(entry: LogEntry): boolean {
  const entries = loadLog();
  entries.push(entry);
  return write(KEY, entries.slice(-MAX_ENTRIES));
}

/** Sets the feeling on the entry completed at `completedAt`; false if there is none or saving failed. */
export function setFeeling(completedAt: string, feeling: Feeling): boolean {
  const entries = loadLog();
  const entry = entries.find((e) => e.completedAt === completedAt);
  if (!entry) return false;
  entry.feeling = feeling;
  return write(KEY, entries);
}

/** Saved completions between weekly recording checks. */
const WEEKLY_CHECK_EVERY = 7;

/** True on every 7th saved completion: the Done screen then asks for a recording of today's passage. */
export function isWeeklyCheck(entries: readonly LogEntry[]): boolean {
  return entries.length > 0 && entries.length % WEEKLY_CHECK_EVERY === 0;
}

export function lastEntry(): LogEntry | undefined {
  const entries = loadLog();
  return entries[entries.length - 1];
}

/** Consecutive days with a completed routine, counting back from today or yesterday. */
export function currentStreak(now = new Date()): number {
  return streakOf(loadLog().map((e) => e.date), now);
}

/** The streak once today counts as done, even if today's entry could not be saved. */
export function streakWithToday(now = new Date()): number {
  return streakOf([...loadLog().map((e) => e.date), localDay(now)], now);
}

function streakOf(dates: string[], now: Date): number {
  const days = new Set(dates);
  const cursor = new Date(now);
  if (!days.has(localDay(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(localDay(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** The latest entry for today, if the routine was finished today. */
export function todayEntry(now = new Date()): LogEntry | undefined {
  const today = localDay(now);
  return loadLog().filter((e) => e.date === today).at(-1);
}
