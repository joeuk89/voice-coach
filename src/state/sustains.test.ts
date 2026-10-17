import { beforeEach, describe, expect, it } from 'vitest';
import { stubLocalStorage } from '../test/local-storage';
import { localDay } from './log';
import { loadSustains, previousBest, recordSustain, removeLastSustain } from './sustains';

let storage: Storage;

beforeEach(() => {
  storage = stubLocalStorage();
});

function save(log: unknown) {
  storage.setItem('vt.sustains', JSON.stringify(log));
}

describe('loadSustains', () => {
  it('keeps only finite numbers and drops empty days', () => {
    save({ '2026-10-15': 5, '2026-10-16': [1, 'x', null, 2], '2026-10-17': [], '2026-10-18': null });
    expect(loadSustains()).toEqual({ '2026-10-16': [1, 2] });
  });

  it('returns an empty log for null and arrays', () => {
    save(null);
    expect(loadSustains()).toEqual({});
    save([1, 2]);
    expect(loadSustains()).toEqual({});
  });
});

describe('recordSustain', () => {
  it('rounds to a tenth of a second', () => {
    recordSustain(12.345, '2026-10-17');
    expect(loadSustains()).toEqual({ '2026-10-17': [12.3] });
  });

  it('keeps the newest 120 days', () => {
    const start = new Date(2026, 0, 1);
    const log: Record<string, number[]> = {};
    for (let i = 0; i < 120; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      log[localDay(d)] = [1];
    }
    save(log);
    const oldest = Object.keys(log).sort()[0]!;
    recordSustain(3, '2026-10-17');
    const days = Object.keys(loadSustains());
    expect(days).toHaveLength(120);
    expect(days).not.toContain(oldest);
    expect(days).toContain('2026-10-17');
  });

  it('survives a malformed day already in storage', () => {
    save({ '2026-10-17': 5 });
    recordSustain(4, '2026-10-17');
    expect(loadSustains()).toEqual({ '2026-10-17': [4] });
  });
});

describe('removeLastSustain', () => {
  it('removes the latest hold of the day', () => {
    save({ '2026-10-17': [3, 4] });
    removeLastSustain('2026-10-17');
    expect(loadSustains()).toEqual({ '2026-10-17': [3] });
  });

  it('removes the day once it is empty', () => {
    save({ '2026-10-16': [2], '2026-10-17': [3] });
    removeLastSustain('2026-10-17');
    expect(loadSustains()).toEqual({ '2026-10-16': [2] });
  });
});

describe('previousBest', () => {
  it('takes the best hold from the latest earlier day', () => {
    save({ '2026-10-10': [9], '2026-10-14': [3], '2026-10-15': [4, 6], '2026-10-17': [8] });
    expect(previousBest('2026-10-17')).toBe(6);
  });

  it('is 0 when there is no earlier day', () => {
    save({ '2026-10-17': [8] });
    expect(previousBest('2026-10-17')).toBe(0);
  });
});
