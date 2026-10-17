import { describe, expect, it } from 'vitest';
import { sustainSummary } from './sustain';

describe('sustainSummary', () => {
  it('says first time only when there are no holds at all', () => {
    expect(sustainSummary([], 0, 0)).toBe('First time');
  });

  it('shows last time and best ever before today’s first hold', () => {
    expect(sustainSummary([], 0.9, 1.2)).toBe('Last time 0.9 s · Best ever 1.2 s');
  });

  it('shows today’s best once there is a hold today', () => {
    expect(sustainSummary([0.7], 0, 0.7)).toBe('Best today 0.7 s · Best ever 0.7 s');
    expect(sustainSummary([0.7, 1.1, 0.8], 0.9, 1.4)).toBe('Best today 1.1 s · Best ever 1.4 s');
  });

  it('shows only best ever when holds exist but none today or before', () => {
    expect(sustainSummary([], 0, 2)).toBe('Best ever 2.0 s');
  });
});
