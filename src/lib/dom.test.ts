import { describe, expect, it } from 'vitest';
import { esc, formatClock, formatMinutes } from './dom';

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

describe('esc', () => {
  it('escapes HTML special characters', () => {
    expect(esc('<a href="x">Tom & Jerry</a>')).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;');
  });
});
