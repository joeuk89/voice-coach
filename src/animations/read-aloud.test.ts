import { describe, expect, it } from 'vitest';
import { contour, layoutDemo } from './read-aloud';

describe('layoutDemo', () => {
  const layout = layoutDemo('I didn’t *say* he *stole* the *money*.');

  it('splits the line into plain and bold runs in order', () => {
    expect(layout.runs.map((r) => [r.text, r.hot])).toEqual([
      ['I didn’t', false],
      ['say', true],
      ['he', false],
      ['stole', true],
      ['the', false],
      ['money', true],
      ['.', false],
    ]);
  });

  it('puts a peak at the centre of each bold word, left to right, inside the axis', () => {
    expect(layout.peaks).toEqual(layout.runs.filter((r) => r.hot).map((r) => r.x));
    expect(layout.peaks).toHaveLength(3);
    expect([...layout.peaks].sort((a, b) => a - b)).toEqual(layout.peaks);
    expect(layout.peaks[0]).toBeGreaterThan(36);
    expect(layout.peaks[2]).toBeLessThan(326);
  });

  it('keeps a short line at 18 px and shrinks a long one to fit', () => {
    expect(layout.size).toBe(18);
    const long = layoutDemo('I wasn’t going to *say* anything at all, *honestly*');
    expect(long.size).toBeLessThan(18);
    expect(long.width).toBeLessThanOrEqual(290);
  });
});

describe('contour', () => {
  it('rises to each peak and scales the rises for pass 2', () => {
    expect(contour([100, 200], 1)).toContain('100 80');
    expect(contour([100, 200], 1)).toContain('200 92');
    expect(contour([100, 200], 0.7)).toContain('100 108.8');
    expect(contour([100, 200], 1)).toMatch(/^M36 176 .* 326 176$/);
  });
});
