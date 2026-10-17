import { beforeEach, describe, expect, it } from 'vitest';
import { stubLocalStorage } from '../test/local-storage';
import { localDay } from './log';
import { bestEver, loadSustains, previousBest, recordSustain, removeLastSustain, todaySustains } from './sustains';

let storage: Storage;

beforeEach(() => {
  storage = stubLocalStorage();
});

function save(log: unknown) {
  storage.setItem('vt.sustains', JSON.stringify(log));
}

describe('loadSustains', () => {
  it('keeps holds saved before steps were stored next to per-step holds', () => {
    save({ '2026-10-16': [3, { step: 1, sec: 4 }] });
    expect(loadSustains()).toEqual({ '2026-10-16': [3, { step: 1, sec: 4 }] });
  });

  it('drops per-step holds with a bad step or time', () => {
    save({
      '2026-10-16': [{ step: -1, sec: 4 }, { step: 1.5, sec: 4 }, { step: '1', sec: 4 }, { step: 1, sec: Infinity }, { step: 2 }, null, { step: 2, sec: 5 }],
      '2026-10-17': [{ sec: 3 }],
    });
    expect(loadSustains()).toEqual({ '2026-10-16': [{ step: 2, sec: 5 }] });
  });

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
  it('saves the step with the time, rounded to a tenth of a second', () => {
    recordSustain(1, 12.345, '2026-10-17');
    expect(loadSustains()).toEqual({ '2026-10-17': [{ step: 1, sec: 12.3 }] });
  });

  it('leaves older holds without a step where they were', () => {
    save({ '2026-10-16': [7], '2026-10-17': [3] });
    recordSustain(0, 4, '2026-10-17');
    expect(loadSustains()).toEqual({ '2026-10-16': [7], '2026-10-17': [3, { step: 0, sec: 4 }] });
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
    recordSustain(0, 3, '2026-10-17');
    const days = Object.keys(loadSustains());
    expect(days).toHaveLength(120);
    expect(days).not.toContain(oldest);
    expect(days).toContain('2026-10-17');
  });

  it('survives a malformed day already in storage', () => {
    save({ '2026-10-17': 5 });
    recordSustain(2, 4, '2026-10-17');
    expect(loadSustains()).toEqual({ '2026-10-17': [{ step: 2, sec: 4 }] });
  });
});

describe('todaySustains', () => {
  it('lists the day’s holds for one step, oldest first, ignoring holds without a step', () => {
    save({
      '2026-10-16': [{ step: 1, sec: 9 }],
      '2026-10-17': [5, { step: 1, sec: 3 }, { step: 2, sec: 8 }, { step: 1, sec: 4 }],
    });
    expect(todaySustains(1, '2026-10-17')).toEqual([3, 4]);
    expect(todaySustains(3, '2026-10-17')).toEqual([]);
  });
});

describe('removeLastSustain', () => {
  it('removes the step’s latest hold of the day and leaves other steps and older holds alone', () => {
    save({ '2026-10-17': [{ step: 1, sec: 3 }, 6, { step: 1, sec: 4 }, { step: 2, sec: 5 }] });
    removeLastSustain(1, '2026-10-17');
    expect(loadSustains()).toEqual({ '2026-10-17': [{ step: 1, sec: 3 }, 6, { step: 2, sec: 5 }] });
  });

  it('removes the day once it is empty', () => {
    save({ '2026-10-16': [2], '2026-10-17': [{ step: 0, sec: 3 }] });
    removeLastSustain(0, '2026-10-17');
    expect(loadSustains()).toEqual({ '2026-10-16': [2] });
  });

  it('does nothing when the step has no hold that day', () => {
    save({ '2026-10-17': [3, { step: 2, sec: 5 }] });
    removeLastSustain(1, '2026-10-17');
    expect(loadSustains()).toEqual({ '2026-10-17': [3, { step: 2, sec: 5 }] });
  });
});

describe('previousBest', () => {
  it('takes the step’s best hold from the latest earlier day that has one', () => {
    save({
      '2026-10-10': [{ step: 1, sec: 9 }],
      '2026-10-14': [{ step: 1, sec: 3 }],
      '2026-10-15': [{ step: 1, sec: 4 }, { step: 1, sec: 6 }, { step: 2, sec: 7 }],
      '2026-10-16': [{ step: 2, sec: 8 }, 12],
      '2026-10-17': [{ step: 1, sec: 8 }],
    });
    expect(previousBest(1, '2026-10-17')).toBe(6);
    expect(previousBest(2, '2026-10-17')).toBe(8);
  });

  it('is 0 when the step has no earlier day, whatever older holds without a step say', () => {
    save({ '2026-10-15': [9], '2026-10-16': [{ step: 0, sec: 4 }], '2026-10-17': [{ step: 1, sec: 8 }] });
    expect(previousBest(1, '2026-10-17')).toBe(0);
  });
});

describe('bestEver', () => {
  it('is the step’s longest hold on any day', () => {
    save({
      '2026-10-15': [{ step: 3, sec: 6 }, { step: 0, sec: 20 }],
      '2026-10-17': [{ step: 3, sec: 7.5 }, { step: 3, sec: 2 }],
    });
    expect(bestEver(3)).toBe(7.5);
  });

  it('counts holds without a step for nothing', () => {
    save({ '2026-10-15': [30], '2026-10-17': [{ step: 3, sec: 2 }] });
    expect(bestEver(3)).toBe(2);
    expect(bestEver(0)).toBe(0);
  });
});
