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

function isFeeling(value: unknown): value is Feeling {
  return FEELINGS.some((f) => f === value);
}

function toEntry(value: unknown): LogEntry | null {
  if (!isRecord(value)) return null;
  const { date, completedAt, routine, totalSec, feeling } = value;
  if (typeof date !== 'string' || typeof completedAt !== 'string' || !isFiniteNumber(totalSec)) return null;
  if (routine !== 'short' && routine !== 'full') return null;
  const entry: LogEntry = { date, completedAt, routine, totalSec };
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

export function lastEntry(): LogEntry | undefined {
  const entries = loadLog();
  return entries[entries.length - 1];
}

/** Consecutive days with a completed routine, counting back from today or yesterday. */
export function currentStreak(now = new Date()): number {
  const days = new Set(loadLog().map((e) => e.date));
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

export function recentFeelings(count = 7): (Feeling | undefined)[] {
  return loadLog()
    .slice(-count)
    .map((e) => e.feeling);
}
