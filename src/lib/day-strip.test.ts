// @vitest-environment happy-dom
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Feeling, LogEntry } from '../types';
import { cellLabel, dayCells, dayState, dayStrip } from './day-strip';

beforeAll(() => {
  vi.stubEnv('TZ', 'Europe/London');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

function entry(date: string, feeling?: Feeling, completedAt = `${date}T08:00:00.000Z`): LogEntry {
  return { date, completedAt, routine: 'full', totalSec: 600, ...(feeling ? { feeling } : {}) };
}

const SAT_17_OCT = new Date(2026, 9, 17, 9);

describe('dayCells', () => {
  it('is the seven days ending today, oldest first', () => {
    const cells = dayCells([], SAT_17_OCT);
    expect(cells.map((c) => c.date)).toEqual([
      '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17',
    ]);
    expect(cells.map((c) => c.initial).join('')).toBe('SMTWTFS');
    expect(cells.map((c) => c.today)).toEqual([false, false, false, false, false, false, true]);
  });

  it('crosses a month end and the clocks going back', () => {
    const cells = dayCells([], new Date(2026, 10, 1, 0, 30));
    expect(cells[0]!.date).toBe('2026-10-26');
    expect(cells.at(-1)!.date).toBe('2026-11-01');
    expect(new Set(cells.map((c) => c.date)).size).toBe(7);
  });

  it('ignores entries outside the week', () => {
    const cells = dayCells([entry('2026-10-10', 'strong'), entry('2026-10-18', 'ok')], SAT_17_OCT);
    expect(cells.every((c) => c.state === 'empty')).toBe(true);
  });
});

describe('dayState', () => {
  it('is empty with no entry and done with an entry but no feeling', () => {
    expect(dayState([], '2026-10-17')).toBe('empty');
    expect(dayState([entry('2026-10-17')], '2026-10-17')).toBe('done');
  });

  it('is the latest feeling noted that day', () => {
    const log = [
      entry('2026-10-17', 'strained', '2026-10-17T08:00:00.000Z'),
      entry('2026-10-17', 'strong', '2026-10-17T12:00:00.000Z'),
      entry('2026-10-17', undefined, '2026-10-17T18:00:00.000Z'),
    ];
    expect(dayState(log, '2026-10-17')).toBe('strong');
  });
});

describe('dayStrip', () => {
  it('labels every day for screen readers and marks today', () => {
    const html = dayStrip([entry('2026-10-17', 'strong'), entry('2026-10-16')], SAT_17_OCT);
    const list = document.createElement('div');
    list.innerHTML = html;
    const items = [...list.querySelectorAll('li')];
    expect(items).toHaveLength(7);
    expect(items.map((li) => li.querySelector('.day-dot')!.className)).toEqual([
      'day-dot empty', 'day-dot empty', 'day-dot empty', 'day-dot empty', 'day-dot empty', 'day-dot done', 'day-dot strong',
    ]);
    expect(items[6]!.getAttribute('aria-current')).toBe('date');
    expect(items.filter((li) => li.hasAttribute('aria-current'))).toHaveLength(1);
    expect(items[6]!.querySelector('.visually-hidden')!.textContent).toBe(cellLabel(dayCells([entry('2026-10-17', 'strong')], SAT_17_OCT)[6]!));
  });

  it('names the state after the date', () => {
    const [, , , , , friday, saturday] = dayCells([entry('2026-10-16'), entry('2026-10-17', 'ok')], SAT_17_OCT);
    expect(cellLabel(friday!)).toMatch(/16.*: done, no note$/);
    expect(cellLabel(saturday!)).toMatch(/17.*\(today\): OK$/);
  });
});
