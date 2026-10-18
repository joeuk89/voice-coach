import { describe, expect, it } from 'vitest';
import { paragraphs } from '../paragraphs';
import {
  contour,
  contourLength,
  glideKeyframes,
  layoutDemo,
  paceSplit,
  paceStops,
  pauseGaps,
  pausePieces,
  pauseStops,
  readAloud,
  timeAt,
  trailKeyframes,
  type Stop,
} from './read-aloud';

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

  it('draws part of the line, keeping only the rises inside it', () => {
    const before = contour([100, 200], 0.4, 36, 150);
    const after = contour([100, 200], 0.4, 150, 326);
    expect(before).toMatch(/^M36 176 .* 150 176$/);
    expect(before).toContain('100 137.6');
    expect(before).not.toContain('200 ');
    expect(after).toMatch(/^M150 176 .* 326 176$/);
    expect(after).toContain('200 142.4');
    expect(after).not.toContain('100 ');
  });
});

describe('contourLength', () => {
  it('is the axis length for a flat line and longer with rises', () => {
    expect(contourLength([], 1)).toBe(290);
    expect(contourLength([100, 200], 1)).toBeGreaterThan(290 + 2 * 96);
  });

  it('adds up across a cut between two peaks', () => {
    const whole = contourLength([100, 200], 0.4);
    expect(contourLength([100, 200], 0.4, 36, 150) + contourLength([100, 200], 0.4, 150, 326)).toBeCloseTo(whole, 6);
  });
});

describe('paceSplit', () => {
  it('cuts between the two peaks nearest the middle of the axis', () => {
    expect(paceSplit([100, 200])).toBe(150);
    expect(paceSplit([80, 150, 280])).toBe(215);
    expect(paceSplit([90])).toBe(181);
  });

  it('cuts every demo line on the baseline, one rise on each side', () => {
    for (const { demo } of paragraphs) {
      const { peaks } = layoutDemo(demo);
      const split = paceSplit(peaks);
      expect(peaks.some((x) => x < split)).toBe(true);
      expect(peaks.some((x) => x > split)).toBe(true);
      expect(contour(peaks, 0.4, 36, split).endsWith(`L ${split} 176`)).toBe(true);
    }
  });
});

describe('pause pass', () => {
  const layout = layoutDemo('I didn’t *say* he *stole* the *money*.');
  const gaps = pauseGaps(layout.runs);
  const hot = layout.runs.filter((r) => r.hot);

  it('breaks the line just before each bold word, with a mark in the break', () => {
    expect(gaps).toHaveLength(3);
    gaps.forEach((gap, i) => {
      const word = hot[i]!;
      expect(gap.to).toBeCloseTo(word.x - word.width / 2, 0);
      expect(gap.to - gap.from).toBeCloseTo(22, 0);
      expect(gap.mark).toBeGreaterThan(gap.from);
      expect(gap.mark).toBeLessThan(gap.to);
    });
  });

  it('draws the line everywhere but the breaks', () => {
    const pieces = pausePieces(gaps);
    expect(pieces).toHaveLength(4);
    expect(pieces[0]![0]).toBe(36);
    expect(pieces[3]![1]).toBe(326);
    pieces.slice(1).forEach(([from], i) => {
      expect(from).toBe(gaps[i]!.to);
      expect(pieces[i]![1]).toBe(gaps[i]!.from);
    });
  });

  it('starts with silence when the line opens on a bold word', () => {
    const opening = pauseGaps([{ text: 'Picture', hot: true, x: 50, width: 20 }]);
    expect(opening).toEqual([{ from: 36, to: 40, mark: 36 }]);
    expect(pausePieces(opening)).toEqual([[40, 326]]);
    expect(pauseStops(opening).slice(0, 2)).toEqual([
      [50, 0],
      [53.13, 0],
    ]);
  });

  it('holds the dot still for half a second at each break, at one speed in between', () => {
    const stops = pauseStops(gaps);
    expect(stops[0]).toEqual([50, 0]);
    expect(stops[stops.length - 1]).toEqual([73, 1]);
    expect(stops).toHaveLength(2 + 2 * gaps.length);
    const speeds: number[] = [];
    for (let i = 1; i < stops.length; i++) {
      const [a0, d0] = stops[i - 1]!;
      const [a1, d1] = stops[i]!;
      if (d1 === d0) expect(a1 - a0).toBeCloseTo(3.125, 1);
      else speeds.push((d1 - d0) / (a1 - a0));
    }
    // The dot crosses each break at the same speed too, so all its moving time covers the whole line.
    const moving = 73 - 50 - gaps.length * 3.125;
    speeds.forEach((v) => expect(v).toBeCloseTo(1 / moving, 3));
  });
});

describe('pace pass', () => {
  it('moves three times faster over the quick half', () => {
    const stops = paceStops(120, 180);
    const [[a0, d0], [a1, d1], [a2, d2]] = stops as [Stop, Stop, Stop];
    expect([a0, d0]).toEqual([75, 0]);
    expect([a2, d2]).toEqual([98, 1]);
    expect(d1).toBeCloseTo(0.4, 6);
    const slow = (d1 - d0) / (a1 - a0);
    const quick = (d2 - d1) / (a2 - a1);
    expect(quick / slow).toBeCloseTo(3, 1);
  });
});

describe('keyframes', () => {
  const stops: Stop[] = [
    [50, 0],
    [55, 0.25],
    [58, 0.25],
    [73, 1],
  ];

  it('finds when the dot first reaches a distance', () => {
    expect(timeAt(stops, 0)).toBe(50);
    expect(timeAt(stops, 0.125)).toBe(52.5);
    expect(timeAt(stops, 0.25)).toBe(55);
    expect(timeAt(stops, 0.5)).toBe(63);
    expect(timeAt(stops, 1)).toBe(73);
  });

  it('writes a held beat as one rule with two times', () => {
    expect(glideKeyframes('g', stops)).toBe(
      '@keyframes g { 0%, 50% { offset-distance: 0%; } 55%, 58% { offset-distance: 25%; } 73%, 100% { offset-distance: 100%; } }',
    );
  });

  it('draws a stretch of line while the dot crosses it', () => {
    expect(trailKeyframes('t', stops, 0.25, 1)).toBe(
      '@keyframes t { 0%, 55% { stroke-dashoffset: 1; } 73%, 100% { stroke-dashoffset: 0; } }',
    );
  });
});

describe('the card', () => {
  const svg = (readAloud.svg as (input?: string) => string)('I didn’t *say* he *stole* the *money*.');

  it('has one pass per quarter, each captioned as its sub-step', () => {
    expect(readAloud.cycleSec).toBe(16);
    expect(readAloud.phases.map((p) => p.until)).toEqual([0.25, 0.5, 0.75, 1]);
    for (const label of ['PASS 1 · OVER THE TOP', 'PASS 2 · 70 PERCENT', 'PASS 3 · PAUSE', 'PASS 4 · PACE', 'SLOW', 'QUICK']) {
      expect(svg).toContain(`>${label}</text>`);
    }
  });

  it('defines every keyframe it names', () => {
    const named = [...svg.matchAll(/animation-name: ([\w-]+)/g)].map((m) => m[1]);
    expect(named.length).toBeGreaterThan(0);
    for (const name of named) expect(svg).toContain(`@keyframes ${name} {`);
  });

  it('keeps every label and word inside the guided screen crop', () => {
    const [, top, , height] = readAloud.compactViewBox!.split(' ').map(Number) as [number, number, number, number];
    for (const [, y] of svg.matchAll(/<text [^>]*y="([\d.]+)"/g)) {
      expect(Number(y)).toBeGreaterThan(top + 13);
      expect(Number(y)).toBeLessThan(top + height - 4);
    }
  });
});
