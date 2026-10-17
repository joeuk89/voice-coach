import { describe, expect, it } from 'vitest';
import { exercises } from '../exercises';
import { activeWindow, animationTime, isInnerLoop, windowProgress, windowTime } from './window';

describe('activeWindow', () => {
  it('treats a missing window or the whole loop as no window', () => {
    expect(activeWindow(undefined)).toBeNull();
    expect(activeWindow(null)).toBeNull();
    expect(activeWindow([0, 1])).toBeNull();
  });

  it('keeps a partial window and clamps it to the loop', () => {
    expect(activeWindow([0.2, 0.4])).toEqual([0.2, 0.4]);
    expect(activeWindow([0.8, 1.2])).toEqual([0.8, 1]);
    expect(activeWindow([-0.1, 0.3])).toEqual([0, 0.3]);
  });
});

describe('windowTime', () => {
  const cycle = 10_000;

  it('starts just inside the window start', () => {
    expect(windowTime([0.2, 0.4], cycle, 0)).toBe(2001);
  });

  it('advances with real time inside the window', () => {
    expect(windowTime([0.2, 0.4], cycle, 1500)).toBe(3500);
  });

  it('wraps back to the start at the window end', () => {
    expect(windowTime([0.2, 0.4], cycle, 2000)).toBe(2001);
    expect(windowTime([0.2, 0.4], cycle, 2500)).toBe(2500);
    expect(windowTime([0.8, 1], cycle, 4100)).toBeCloseTo(8100);
  });

  it('stops just inside the window end', () => {
    expect(windowTime([0.2, 0.4], cycle, 1999.5)).toBe(3999);
  });

  it('never leaves [from, to) over many window lengths', () => {
    for (let elapsed = 0; elapsed < 50_000; elapsed += 37) {
      const t = windowTime([0.45, 0.65], cycle, elapsed);
      expect(t).toBeGreaterThan(4500);
      expect(t).toBeLessThan(6500);
    }
  });

  it('holds the start of an empty window', () => {
    expect(windowTime([0.5, 0.5], cycle, 1234)).toBe(5000);
  });
});

describe('windowProgress', () => {
  it('runs from 0 at the window start to 1 at its end', () => {
    expect(windowProgress([0.2, 0.4], 10_000, 2000)).toBe(0);
    expect(windowProgress([0.2, 0.4], 10_000, 3000)).toBe(0.5);
    expect(windowProgress([0.2, 0.4], 10_000, 4000)).toBe(1);
  });

  it('clamps times outside the window', () => {
    expect(windowProgress([0.2, 0.4], 10_000, 500)).toBe(0);
    expect(windowProgress([0.2, 0.4], 10_000, 9000)).toBe(1);
  });
});

describe('isInnerLoop', () => {
  it('separates short repeating loops from the whole cycle', () => {
    expect(isInnerLoop(500, 12_000)).toBe(true);
    expect(isInnerLoop(1200, 12_000)).toBe(true);
    expect(isInnerLoop(12_000, 12_000)).toBe(false);
    expect(isInnerLoop(24_000, 12_000)).toBe(false);
  });
});

describe('animationTime', () => {
  it('uses the loop time directly once past the delay', () => {
    expect(animationTime(3500, 1200, 0)).toBe(3500);
    expect(animationTime(3500, 1200, 400)).toBe(3500);
  });

  it('skips whole iterations to stay out of the start delay', () => {
    expect(animationTime(100, 1200, 400)).toBe(1300);
    expect(animationTime(100, 1200, 800)).toBe(1300);
    expect(animationTime(0, 140, 70)).toBe(140);
  });

  it('keeps the phase the live loop would show', () => {
    const phase = (time: number, duration: number, delay: number) => (((time - delay) % duration) + duration) % duration;
    expect(phase(animationTime(100, 1200, 800), 1200, 800)).toBe(phase(100, 1200, 800));
  });
});

describe('exercise windows', () => {
  it('are ordered fractions of the loop', () => {
    for (const e of exercises) {
      for (const s of e.subSteps) {
        if (!s.window) continue;
        const [from, to] = s.window;
        expect(from, e.id).toBeGreaterThanOrEqual(0);
        expect(to, e.id).toBeLessThanOrEqual(1);
        expect(from, e.id).toBeLessThan(to);
      }
    }
  });

  it('only appear on exercises with an animation', () => {
    for (const e of exercises) {
      if (e.subSteps.some((s) => s.window)) expect(e.animation, e.id).not.toBeNull();
    }
  });
});
