import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubLocalStorage } from '../test/local-storage';
import type { LogEntry } from '../types';
import { appendLog, currentStreak, loadLog, localDay, setFeeling } from './log';

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

describe('loadLog', () => {
  it('keeps only well-formed entries', () => {
    const good = entry('2026-10-17');
    saveLog([null, 5, { date: '2026-10-17' }, { ...good, routine: 'medium' }, { ...good, totalSec: '600' }, good]);
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
    saveLog(Array.from({ length: 400 }, (_, i) => entry('2026-01-01', `t${i}`)));
    expect(appendLog(entry('2026-10-17', 'newest'))).toBe(true);
    const log = loadLog();
    expect(log).toHaveLength(400);
    expect(log[0]!.completedAt).toBe('t1');
    expect(log[399]!.completedAt).toBe('newest');
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
    saveLog([entry('2026-10-16', 'a'), entry('2026-10-17', 'b')]);
    expect(setFeeling('a', 'strong')).toBe(true);
    expect(loadLog().map((e) => e.feeling)).toEqual(['strong', undefined]);
  });

  it('changes nothing when no entry matches', () => {
    saveLog([entry('2026-10-17', 'b')]);
    expect(setFeeling('missing', 'ok')).toBe(false);
    expect(loadLog()[0]!.feeling).toBeUndefined();
  });
});
