import { localDay } from './log';
import { isFiniteNumber, isRecord, read, write } from './storage';

const KEY = 'sustains';
const MAX_DAYS = 120;

export interface StepHold {
  /** The exercise's sub-step index. */
  step: number;
  sec: number;
}

/** A bare number is a hold saved before holds carried their step: kept in storage, counted for nothing. */
export type SustainEntry = number | StepHold;

/** Sustained-note holds grouped by local day, oldest first within a day. */
export type SustainLog = Record<string, SustainEntry[]>;

function isEntry(value: unknown): value is SustainEntry {
  if (isFiniteNumber(value)) return true;
  return isRecord(value) && typeof value.step === 'number' && Number.isInteger(value.step) && value.step >= 0 && isFiniteNumber(value.sec);
}

export function loadSustains(): SustainLog {
  const raw = read(KEY);
  if (!isRecord(raw)) return {};
  const log: SustainLog = {};
  for (const [day, holds] of Object.entries(raw)) {
    const entries = Array.isArray(holds) ? holds.filter(isEntry) : [];
    if (entries.length) log[day] = entries;
  }
  return log;
}

/** False when the hold could not be saved. */
export function recordSustain(step: number, seconds: number, day = localDay()): boolean {
  const log = loadSustains();
  log[day] = [...(log[day] ?? []), { step, sec: Math.round(seconds * 10) / 10 }];
  const days = Object.keys(log).sort();
  for (const old of days.slice(0, Math.max(0, days.length - MAX_DAYS))) delete log[old];
  return write(KEY, log);
}

export function removeLastSustain(step: number, day = localDay()): void {
  const log = loadSustains();
  const today = log[day] ?? [];
  const last = today.findLastIndex((e) => typeof e === 'object' && e.step === step);
  if (last < 0) return;
  today.splice(last, 1);
  if (today.length === 0) delete log[day];
  write(KEY, log);
}

function stepSeconds(entries: readonly SustainEntry[] | undefined, step: number): number[] {
  return (entries ?? []).flatMap((e) => (typeof e === 'object' && e.step === step ? [e.sec] : []));
}

export function todaySustains(step: number, day = localDay()): number[] {
  return stepSeconds(loadSustains()[day], step);
}

export function bestEver(step: number): number {
  return Math.max(0, ...Object.values(loadSustains()).flatMap((entries) => stepSeconds(entries, step)));
}

/** The step's best hold from the most recent day before today on which it has any. */
export function previousBest(step: number, day = localDay()): number {
  const log = loadSustains();
  const prior = Object.keys(log)
    .filter((d) => d < day && stepSeconds(log[d], step).length)
    .sort()
    .pop();
  return prior ? Math.max(...stepSeconds(log[prior], step)) : 0;
}
