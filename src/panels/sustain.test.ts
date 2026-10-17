import { describe, expect, it } from 'vitest';
import { recentHolds, summaryNote } from './sustain';

describe('summaryNote', () => {
  it('explains the stopwatch the first time', () => {
    expect(summaryNote([], 0, 0)).toBe('First time: tap Start hold as the note begins.');
  });

  it('shows the last time and best ever before today’s first hold', () => {
    expect(summaryNote([], 0.9, 1.24)).toBe('Last time 0.9 s · Best ever 1.2 s');
  });

  it('leads into today’s holds once there is one', () => {
    expect(summaryNote([0.7, 1.1], 0.9, 1.4)).toBe('Best ever 1.4 s · Today');
  });

  it('shows only best ever when there is no earlier day', () => {
    expect(summaryNote([], 0, 2)).toBe('Best ever 2.0 s');
  });
});

describe('recentHolds', () => {
  it('lists today’s holds newest first', () => {
    expect(recentHolds([1, 2, 3])).toEqual({ shown: [3, 2, 1], more: 0 });
  });

  it('caps the list and counts the rest', () => {
    expect(recentHolds([1, 2, 3, 4, 5], 3)).toEqual({ shown: [5, 4, 3], more: 2 });
  });
});
