import { describe, expect, it } from 'vitest';
import { esc, formatClock, formatDuration, formatMinutes, formatPractice } from './dom';

describe('formatClock', () => {
  it('shows minutes and padded seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(61)).toBe('1:01');
    expect(formatClock(836)).toBe('13:56');
  });

  it('rounds to the nearest second', () => {
    expect(formatClock(59.4)).toBe('0:59');
    expect(formatClock(59.5)).toBe('1:00');
  });

  it('never goes below zero', () => {
    expect(formatClock(-5)).toBe('0:00');
  });
});

describe('formatDuration', () => {
  it('shows m:ss under an hour', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(754)).toBe('12:34');
    expect(formatDuration(3599)).toBe('59:59');
  });

  it('shows hours and minutes from an hour on', () => {
    expect(formatDuration(3600)).toBe('1 h');
    expect(formatDuration(5400)).toBe('1 h 30 min');
    expect(formatDuration(7200)).toBe('2 h');
    expect(formatDuration(7260)).toBe('2 h 1 min');
    expect(formatDuration(108061)).toBe('30 h 1 min');
  });

  it('rounds to the second before choosing a format', () => {
    expect(formatDuration(3599.6)).toBe('1 h');
  });
});

describe('formatMinutes', () => {
  it('shows 0 min for nothing', () => {
    expect(formatMinutes(0)).toBe('0 min');
  });

  it('shows at least 1 min for any time', () => {
    expect(formatMinutes(20)).toBe('1 min');
    expect(formatMinutes(60)).toBe('1 min');
  });

  it('rounds to the nearest minute', () => {
    expect(formatMinutes(89)).toBe('1 min');
    expect(formatMinutes(90)).toBe('2 min');
    expect(formatMinutes(600)).toBe('10 min');
  });
});

describe('formatPractice', () => {
  it('says under 1 min for less than a minute', () => {
    expect(formatPractice(0)).toBe('under 1 min');
    expect(formatPractice(59)).toBe('under 1 min');
  });

  it('shows minutes under an hour, then hours and minutes', () => {
    expect(formatPractice(60)).toBe('1 min');
    expect(formatPractice(1925)).toBe('32 min');
    expect(formatPractice(3599)).toBe('60 min');
    expect(formatPractice(3900)).toBe('1 h 5 min');
  });
});

describe('esc', () => {
  it('escapes HTML special characters', () => {
    expect(esc('<a href="x">Tom & Jerry</a>')).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;');
  });
});
