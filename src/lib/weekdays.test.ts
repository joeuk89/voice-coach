import { describe, expect, it } from 'vitest';
import { daysPhrase, formatDays, isWeekday, joinAnd, WEEK_ORDER, WEEKDAY_INITIALS, WEEKDAY_LONG, WEEKDAY_SHORT } from './weekdays';

describe('weekday names', () => {
  it('follows Date.getDay(), Sunday first', () => {
    expect(WEEKDAY_INITIALS.join('')).toBe('SMTWTFS');
    expect(WEEKDAY_SHORT[0]).toBe('Sun');
    expect(WEEKDAY_LONG[1]).toBe('Monday');
    expect(WEEKDAY_SHORT[new Date(2026, 9, 19).getDay()]).toBe('Mon');
  });

  it('shows the week Monday first', () => {
    expect(WEEK_ORDER.map((d) => WEEKDAY_SHORT[d])).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
});

describe('isWeekday', () => {
  it('accepts the integers 0 to 6 only', () => {
    expect([0, 3, 6].every(isWeekday)).toBe(true);
    expect([-1, 7, 1.5, '1', null, Number.NaN].some(isWeekday)).toBe(false);
  });
});

describe('formatDays', () => {
  it('says every day for all seven', () => {
    expect(formatDays([0, 1, 2, 3, 4, 5, 6])).toBe('Every day');
  });

  it('lists the short names in week order from Monday', () => {
    expect(formatDays([1, 3, 5])).toBe('Mon, Wed, Fri');
    expect(formatDays([0, 2, 4, 6])).toBe('Tue, Thu, Sat, Sun');
    expect(formatDays([5, 1])).toBe('Mon, Fri');
    expect(formatDays([0])).toBe('Sun');
  });
});

describe('joinAnd', () => {
  it('joins with commas and a final "and"', () => {
    expect(joinAnd([])).toBe('');
    expect(joinAnd(['a'])).toBe('a');
    expect(joinAnd(['a', 'b'])).toBe('a and b');
    expect(joinAnd(['a', 'b', 'c'])).toBe('a, b and c');
  });
});

describe('daysPhrase', () => {
  it('reads inside a sentence', () => {
    expect(daysPhrase([1, 3, 5])).toBe('Mon, Wed and Fri');
    expect(daysPhrase([0, 6])).toBe('Sat and Sun');
    expect(daysPhrase([0, 1, 2, 3, 4, 5, 6])).toBe('every day');
  });
});
