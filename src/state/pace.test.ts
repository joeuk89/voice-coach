import { describe, expect, it } from 'vitest';
import { paceAt } from './pace';

const pace = { inSec: 4, outSec: 8 };
const at = (sec: number, total = 8, from = 0) => paceAt(sec * 1000, pace, total, from);
const label = (sec: number, total = 8, from = 0) => {
  const m = at(sec, total, from);
  return [m.phase, m.breath, m.secondsLeft];
};

describe('paceAt', () => {
  it('counts the lead-in down from 3 to 1 on the first breath', () => {
    expect([0, 0.5, 1, 2, 2.99].map((s) => label(s))).toEqual([
      ['ready', 0, 3],
      ['ready', 0, 3],
      ['ready', 0, 2],
      ['ready', 0, 1],
      ['ready', 0, 1],
    ]);
  });

  it('counts the inhale from 4 to 1 and the exhale from 8 to 1', () => {
    expect([3, 3.5, 4, 6, 6.99].map((s) => label(s))).toEqual([
      ['in', 0, 4],
      ['in', 0, 4],
      ['in', 0, 3],
      ['in', 0, 1],
      ['in', 0, 1],
    ]);
    expect([7, 8, 14, 14.99].map((s) => label(s))).toEqual([
      ['out', 0, 8],
      ['out', 0, 7],
      ['out', 0, 1],
      ['out', 0, 1],
    ]);
  });

  it('starts the next breath on the inhale every 12 seconds', () => {
    expect(label(15)).toEqual(['in', 1, 4]);
    expect(label(3 + 12 * 7 + 4)).toEqual(['out', 7, 8]);
  });

  it('reports how far into the breath it is', () => {
    expect(at(3).breathMs).toBe(0);
    expect(at(8.25).breathMs).toBe(5250);
    expect(at(2).breathMs).toBe(0);
  });

  it('finishes after the last exhale', () => {
    expect(label(3 + 12 * 8 - 0.01)).toEqual(['out', 7, 1]);
    expect(label(3 + 12 * 8)).toEqual(['done', 8, 0]);
    expect(label(1000)).toEqual(['done', 8, 0]);
    expect(label(3 + 12 * 5, 5)).toEqual(['done', 5, 0]);
  });

  it('resumes from a later breath after its own lead-in', () => {
    expect(label(1, 8, 3)).toEqual(['ready', 3, 2]);
    expect(label(3, 8, 3)).toEqual(['in', 3, 4]);
    expect(label(3 + 12 * 5, 8, 3)).toEqual(['done', 8, 0]);
  });
});
