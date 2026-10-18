import { describe, expect, it } from 'vitest';
import { barSpan, countWindow, stairs } from './dynamics';

describe('stairs', () => {
  const bars = stairs(10, 60, 344, 182, 6, 28);

  it('fills the lane left to right with ten bars on one baseline, each taller than the last', () => {
    expect(bars).toHaveLength(10);
    expect(bars[0]!.x).toBe(60);
    expect(bars[9]!.x + bars[9]!.width).toBeCloseTo(344, 1);
    for (const [i, bar] of bars.entries()) {
      expect(bar.y + bar.height).toBeCloseTo(182, 1);
      if (i > 0) {
        expect(bar.height).toBeGreaterThan(bars[i - 1]!.height);
        expect(bar.x).toBeGreaterThan(bars[i - 1]!.x + bars[i - 1]!.width);
      }
    }
    expect(bars[0]!.height).toBe(6);
    expect(bars[9]!.height).toBe(28);
  });

  it('keeps the bars wide enough to read at phone width', () => {
    expect(bars[0]!.width).toBeGreaterThanOrEqual(20);
  });
});

describe('barSpan', () => {
  it('lights bar 1 for the whole count and bar 10 around the turn, each span inside the last', () => {
    expect(barSpan(1)).toEqual(countWindow);
    expect(barSpan(10)).toEqual([61.25, 63.75]);
    for (let n = 2; n <= 10; n++) {
      const [on, off] = barSpan(n);
      const [prevOn, prevOff] = barSpan(n - 1);
      expect(on).toBeGreaterThan(prevOn);
      expect(off).toBeLessThan(prevOff);
    }
  });
});
