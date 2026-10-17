import { describe, expect, it } from 'vitest';
import { exercises } from '../exercises';
import { isComplete, repLabel } from './reps';

const text = (...args: Parameters<typeof repLabel>) => {
  const { lead, shown, tail } = repLabel(...args);
  return [lead, String(shown), tail].filter(Boolean).join(' ');
};

describe('repLabel', () => {
  it('counts up towards the target', () => {
    expect(text(0, 8, 'Rep')).toBe('Rep 0 of 8');
    expect(text(5, 8, 'Rep')).toBe('Rep 5 of 8');
    expect(text(1, 2, 'Hold')).toBe('Hold 1 of 2');
  });

  it('keeps the noun and drops the pitch once the target is reached', () => {
    expect(text(8, 8, 'Rep')).toBe('Rep 8 of 8');
    expect(text(2, 2, 'Hold')).toBe('Hold 2 of 2');
  });

  it('never shows more than the target', () => {
    expect(text(3, 2, 'Hold')).toBe('Hold 2 of 2');
  });

  it('names the pitch, moving up one every repsPerPitch holds', () => {
    expect([0, 1, 2, 3, 8, 9].map((n) => text(n, 10, 'Hold', 2))).toEqual([
      'Hold 0 of 10 · pitch 1',
      'Hold 1 of 10 · pitch 1',
      'Hold 2 of 10 · pitch 2',
      'Hold 3 of 10 · pitch 2',
      'Hold 8 of 10 · pitch 5',
      'Hold 9 of 10 · pitch 5',
    ]);
    expect(text(10, 10, 'Hold', 2)).toBe('Hold 10 of 10');
  });

  it('keeps the count separate from the words', () => {
    expect(repLabel(3, 10, 'Hold', 2)).toEqual({ lead: 'Hold', shown: 3, tail: 'of 10 · pitch 2' });
    expect(repLabel(10, 10, 'Hold', 2)).toEqual({ lead: 'Hold', shown: 10, tail: 'of 10' });
  });
});

describe('isComplete', () => {
  it('is complete at or past the target', () => {
    expect(isComplete(7, 8)).toBe(false);
    expect(isComplete(8, 8)).toBe(true);
    expect(isComplete(9, 8)).toBe(true);
  });
});

describe('VFE adduction', () => {
  it('runs five pitches of two holds', () => {
    const adduction = exercises.find((e) => e.id === 'vfe')!.subSteps[3]!;
    expect(adduction.reps! / adduction.repsPerPitch!).toBe(5);
  });
});
