import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubLocalStorage } from '../test/local-storage';
import type { LogEntry } from '../types';
import { appendLog, currentStreak, isWeeklyCheck, loadLog, localDay, parseDay, setFeeling, streakWithToday, todayEntry } from './log';

let storage: Storage;

beforeAll(() => {
  vi.stubEnv('TZ', 'Europe/London');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

beforeEach(() => {
  storage = stubLocalStorage();
});

function entry(date: string, completedAt = `${date}T08:00:00.000Z`): LogEntry {
  return { date, completedAt, routine: 'full', totalSec: 600 };
}

function saveLog(entries: unknown[]) {
  storage.setItem('vt.log', JSON.stringify(entries));
}

describe('localDay', () => {
  it('uses the local calendar, not UTC', () => {
    expect(localDay(new Date('2026-10-17T23:30:00Z'))).toBe('2026-10-18');
  });

  it('changes at local midnight', () => {
    expect(localDay(new Date(2026, 9, 17, 23, 59, 59))).toBe('2026-10-17');
    expect(localDay(new Date(2026, 9, 18, 0, 0, 0))).toBe('2026-10-18');
  });
});

describe('parseDay', () => {
  it('gives local midnight of a real day', () => {
    expect(parseDay('2026-10-17')).toEqual(new Date(2026, 9, 17));
    expect(parseDay('2024-02-29')).toEqual(new Date(2024, 1, 29));
  });

  it('rejects other shapes and impossible dates', () => {
    for (const bad of ['', 'x', '2026-1-17', '2026-10-17T08:00', '17/10/2026', '2026-13-01', '2026-02-30', '0050-01-01']) {
      expect(parseDay(bad)).toBeNull();
    }
  });
});

describe('currentStreak', () => {
  it('is 0 with no log', () => {
    expect(currentStreak(new Date(2026, 9, 17, 9))).toBe(0);
  });

  it('counts back from today', () => {
    saveLog([entry('2026-10-15'), entry('2026-10-16'), entry('2026-10-17')]);
    expect(currentStreak(new Date(2026, 9, 17, 9))).toBe(3);
  });

  it('still counts from yesterday just after midnight', () => {
    saveLog([entry('2026-10-16'), entry('2026-10-17')]);
    expect(currentStreak(new Date(2026, 9, 18, 0, 5))).toBe(2);
  });

  it('is 0 once a whole day is missed', () => {
    saveLog([entry('2026-10-16'), entry('2026-10-17')]);
    expect(currentStreak(new Date(2026, 9, 19, 0, 5))).toBe(0);
  });

  it('stops at a missed day', () => {
    saveLog([entry('2026-10-14'), entry('2026-10-16'), entry('2026-10-17')]);
    expect(currentStreak(new Date(2026, 9, 17, 9))).toBe(2);
  });

  it('counts across the clocks going back and forward', () => {
    saveLog([entry('2026-10-24'), entry('2026-10-25'), entry('2026-10-26')]);
    expect(currentStreak(new Date(2026, 9, 26, 0, 30))).toBe(3);
    saveLog([entry('2026-03-28'), entry('2026-03-29'), entry('2026-03-30')]);
    expect(currentStreak(new Date(2026, 2, 30, 0, 30))).toBe(3);
  });
});

describe('streakWithToday', () => {
  it('is Day 1 on a first day, saved or not', () => {
    expect(streakWithToday(new Date(2026, 9, 17, 9))).toBe(1);
    saveLog([entry('2026-10-17')]);
    expect(streakWithToday(new Date(2026, 9, 17, 9))).toBe(1);
  });

  it('adds today to a streak that ended yesterday', () => {
    saveLog([entry('2026-10-15'), entry('2026-10-16')]);
    expect(streakWithToday(new Date(2026, 9, 17, 9))).toBe(3);
  });

  it('does not count today twice after a second routine', () => {
    saveLog([entry('2026-10-16'), entry('2026-10-17'), entry('2026-10-17', '2026-10-17T18:00:00.000Z')]);
    expect(streakWithToday(new Date(2026, 9, 17, 19))).toBe(2);
  });

  it('starts again after a missed day', () => {
    saveLog([entry('2026-10-14'), entry('2026-10-15')]);
    expect(streakWithToday(new Date(2026, 9, 17, 9))).toBe(1);
  });
});

describe('todayEntry', () => {
  it('is the latest entry for today', () => {
    const later = entry('2026-10-17', '2026-10-17T18:00:00.000Z');
    saveLog([entry('2026-10-16'), entry('2026-10-17'), later]);
    expect(todayEntry(new Date(2026, 9, 17, 19))).toEqual(later);
  });

  it('is undefined when today has no entry', () => {
    saveLog([entry('2026-10-16')]);
    expect(todayEntry(new Date(2026, 9, 17, 9))).toBeUndefined();
  });
});

describe('loadLog', () => {
  it('keeps a positive whole step count and drops any other', () => {
    const good = entry('2026-10-17');
    saveLog([{ ...good, steps: 8 }, { ...good, steps: 0 }, { ...good, steps: 2.5 }, { ...good, steps: '8' }]);
    expect(loadLog().map((e) => e.steps)).toEqual([8, undefined, undefined, undefined]);
  });

  it('keeps only well-formed entries', () => {
    const good = entry('2026-10-17');
    saveLog([null, 5, { date: '2026-10-17' }, { ...good, routine: 'medium' }, { ...good, totalSec: '600' }, good]);
    expect(loadLog()).toEqual([good]);
  });

  it('drops entries with a bad date or completedAt', () => {
    const good = entry('2026-10-17');
    saveLog([{ ...good, date: 'x' }, { ...good, date: '2026-02-30' }, { ...good, completedAt: 'x' }, good]);
    expect(loadLog()).toEqual([good]);
  });

  it('drops an unknown feeling but keeps the entry', () => {
    saveLog([{ ...entry('2026-10-17'), feeling: '"><b>' }, { ...entry('2026-10-18'), feeling: 'ok' }]);
    expect(loadLog().map((e) => e.feeling)).toEqual([undefined, 'ok']);
  });

  it('returns an empty list for a non-array', () => {
    storage.setItem('vt.log', '{"date":"2026-10-17"}');
    expect(loadLog()).toEqual([]);
  });
});

describe('appendLog', () => {
  it('keeps the newest 400 entries', () => {
    const at = (i: number) => new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString();
    saveLog(Array.from({ length: 400 }, (_, i) => entry('2026-01-01', at(i))));
    const newest = entry('2026-10-17');
    expect(appendLog(newest)).toBe(true);
    const log = loadLog();
    expect(log).toHaveLength(400);
    expect(log[0]!.completedAt).toBe(at(1));
    expect(log[399]!.completedAt).toBe(newest.completedAt);
  });

  it('returns false when the write fails', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(appendLog(entry('2026-10-17'))).toBe(false);
  });
});

describe('setFeeling', () => {
  it('sets the feeling on the entry with that completedAt', () => {
    saveLog([entry('2026-10-16'), entry('2026-10-17')]);
    expect(setFeeling('2026-10-16T08:00:00.000Z', 'strong')).toBe(true);
    expect(loadLog().map((e) => e.feeling)).toEqual(['strong', undefined]);
  });

  it('changes nothing when no entry matches', () => {
    saveLog([entry('2026-10-17')]);
    expect(setFeeling('2026-10-16T08:00:00.000Z', 'ok')).toBe(false);
    expect(loadLog()[0]!.feeling).toBeUndefined();
  });
});

describe('isWeeklyCheck', () => {
  const entries = (count: number) => Array.from({ length: count }, (_, i) => entry(localDay(new Date(2026, 9, 1 + i))));

  it('is true on every 7th saved completion', () => {
    expect([0, 6, 7, 13, 14].map((n) => isWeeklyCheck(entries(n)))).toEqual([false, false, true, false, true]);
  });
});
