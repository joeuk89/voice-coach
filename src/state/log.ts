import type { Feeling, LogEntry } from '../types';
import { read, write } from './storage';

const KEY = 'log';
const MAX_ENTRIES = 400;

export function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function loadLog(): LogEntry[] {
  const entries = read<LogEntry[]>(KEY, []);
  return Array.isArray(entries) ? entries : [];
}

export function appendLog(entry: LogEntry): void {
  const entries = loadLog();
  entries.push(entry);
  write(KEY, entries.slice(-MAX_ENTRIES));
}

export function setLatestFeeling(feeling: Feeling): void {
  const entries = loadLog();
  const last = entries[entries.length - 1];
  if (!last) return;
  last.feeling = feeling;
  write(KEY, entries);
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
