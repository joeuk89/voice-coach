import { localDay } from './log';
import { read, write } from './storage';

const KEY = 'sustains';
const MAX_DAYS = 120;

/** Seconds held per sustained note, grouped by local day. */
export type SustainLog = Record<string, number[]>;

export function loadSustains(): SustainLog {
  const log = read<SustainLog>(KEY, {});
  return log && typeof log === 'object' ? log : {};
}

export function recordSustain(seconds: number, day = localDay()): void {
  const log = loadSustains();
  log[day] = [...(log[day] ?? []), Math.round(seconds * 10) / 10];
  const days = Object.keys(log).sort();
  for (const old of days.slice(0, Math.max(0, days.length - MAX_DAYS))) delete log[old];
  write(KEY, log);
}

export function removeLastSustain(day = localDay()): void {
  const log = loadSustains();
  const today = log[day];
  if (!today?.length) return;
  today.pop();
  if (today.length === 0) delete log[day];
  write(KEY, log);
}

export function todaySustains(day = localDay()): number[] {
  return loadSustains()[day] ?? [];
}

export function bestEver(): number {
  return Math.max(0, ...Object.values(loadSustains()).flat());
}

/** Best hold from the most recent day before today that has any. */
export function previousBest(day = localDay()): number {
  const log = loadSustains();
  const prior = Object.keys(log)
    .filter((d) => d < day)
    .sort()
    .pop();
  return prior ? Math.max(0, ...(log[prior] ?? [])) : 0;
}
