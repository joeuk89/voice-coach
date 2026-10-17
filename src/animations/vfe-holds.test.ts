// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HoldPlayer } from '../types';
import { holdFraction, mountVfeHolds, PITCHES, restingPoint, segments, treadEnds } from './vfe-holds';

describe('segments', () => {
  it('cuts each tread into one line per hold, inside the tread ends', () => {
    const segs = segments(2);
    expect(segs).toHaveLength(PITCHES * 2);
    const [a, b] = segs;
    const [treadStart, treadEnd] = treadEnds(0);
    expect(a!.x1).toBe(treadStart);
    expect(a!.x2).toBeLessThan(b!.x1);
    expect(b!.x2).toBe(treadEnd);
    expect(a!.y).toBe(b!.y);
  });

  it('rises one pitch per group of holds', () => {
    const segs = segments(2);
    expect(segs[1]!.y).toBe(segs[0]!.y);
    expect(segs[2]!.y).toBeLessThan(segs[1]!.y);
    expect(segs[9]!.y).toBeLessThan(segs[7]!.y - 20);
  });
});

describe('holdFraction', () => {
  it('grows with the hold and never completes', () => {
    expect(holdFraction(0)).toBe(0);
    expect(holdFraction(500)).toBeGreaterThan(0.05);
    expect(holdFraction(8000)).toBeCloseTo(0.63, 2);
    expect(holdFraction(30000)).toBeGreaterThan(0.97);
    expect(holdFraction(30000)).toBeLessThan(1);
    expect(holdFraction(-5)).toBe(0);
  });
});

describe('restingPoint', () => {
  it('waits at the start of the next line, then at the end of the last', () => {
    const segs = segments(2);
    expect(restingPoint(segs, 0)).toEqual({ x: segs[0]!.x1, y: segs[0]!.y });
    expect(restingPoint(segs, 3)).toEqual({ x: segs[3]!.x1, y: segs[3]!.y });
    expect(restingPoint(segs, 10)).toEqual({ x: segs[9]!.x2, y: segs[9]!.y });
  });
});

describe('mountVfeHolds', () => {
  let container: HTMLElement;
  let player: { setWindow: ReturnType<typeof vi.fn<HoldPlayer['setWindow']>> };
  let now = 0;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask'] });
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    now = 0;
    container = document.createElement('div');
    container.innerHTML = '<div class="anim anim-vfe"><svg></svg></div><div class="anim-progress"><i></i></div>';
    document.body.append(container);
    player = { setWindow: vi.fn<HoldPlayer['setWindow']>() };
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mount = () => mountVfeHolds(container, player, [0.52, 1], 2);
  const seg = (i: number) => container.querySelectorAll<SVGLineElement>('.vf-seg')[i]!;
  const drawn = (i: number) => 1 - Number(seg(i).style.strokeDashoffset || 1);
  const dot = () => container.querySelector<SVGCircleElement>('.vf-live-dot')!;
  const currentTread = () => [...container.querySelectorAll('.vf-tread')].findIndex((el) => el.classList.contains('current'));
  const tick = (ms: number) => {
    now += ms;
    vi.advanceTimersToNextFrame();
  };

  it('parks the loop at the step and swaps in the live staircase', () => {
    const picture = mount();
    expect(player.setWindow).toHaveBeenCalledWith([0.52, 0.521]);
    expect(container.querySelector('.anim')!.classList.contains('vf-held')).toBe(true);
    expect(container.classList.contains('anim-held')).toBe(true);
    expect(container.querySelectorAll('.vf-seg')).toHaveLength(10);
    expect(currentTread()).toBe(0);
    picture.stop();
    expect(container.querySelector('.vf-live')).toBeNull();
    expect(container.querySelector('.anim')!.classList.contains('vf-held')).toBe(false);
    expect(container.classList.contains('anim-held')).toBe(false);
  });

  it('draws the running hold along its line, longer for a longer hold', () => {
    const picture = mount();
    picture.setRunning(true);
    tick(2000);
    const short = drawn(0);
    expect(short).toBeGreaterThan(0);
    tick(8000);
    expect(drawn(0)).toBeGreaterThan(short);
    expect(drawn(1)).toBe(0);
    expect(dot().style.transform).not.toBe(`translate(${segments(2)[0]!.x1}px, ${segments(2)[0]!.y}px)`);
  });

  it('keeps a recorded hold and moves the dot to the next line', () => {
    const picture = mount();
    picture.setRunning(true);
    tick(5000);
    const length = drawn(0);
    picture.setRunning(false);
    picture.setCount(1);
    vi.runAllTicks();
    expect(drawn(0)).toBe(length);
    const next = segments(2)[1]!;
    expect(dot().style.transform).toBe(`translate(${next.x1}px, ${next.y}px)`);
    expect(currentTread()).toBe(0);
    picture.setRunning(true);
    tick(5000);
    picture.setRunning(false);
    picture.setCount(2);
    expect(currentTread()).toBe(1);
  });

  it('clears a hold the panel stopped without recording', () => {
    const picture = mount();
    picture.setRunning(true);
    tick(300);
    expect(drawn(0)).toBeGreaterThan(0);
    picture.setRunning(false);
    vi.runAllTicks();
    expect(drawn(0)).toBe(0);
    const start = segments(2)[0]!;
    expect(dot().style.transform).toBe(`translate(${start.x1}px, ${start.y}px)`);
  });

  it('clears the undone hold and steps the dot back', () => {
    const picture = mount();
    for (let i = 0; i < 3; i++) {
      picture.setRunning(true);
      tick(4000);
      picture.setRunning(false);
      picture.setCount(i + 1);
    }
    expect(currentTread()).toBe(1);
    picture.setCount(2);
    expect(drawn(2)).toBe(0);
    expect(drawn(1)).toBeGreaterThan(0);
    expect(currentTread()).toBe(1);
    const back = segments(2)[2]!;
    expect(dot().style.transform).toBe(`translate(${back.x1}px, ${back.y}px)`);
  });

  it('rests at the end once every hold is in, and draws nothing for extra holds', () => {
    const picture = mount();
    for (let i = 0; i < 10; i++) {
      picture.setRunning(true);
      tick(4000);
      picture.setRunning(false);
      picture.setCount(i + 1);
    }
    expect(currentTread()).toBe(-1);
    const last = segments(2)[9]!;
    expect(dot().style.transform).toBe(`translate(${last.x2}px, ${last.y}px)`);
    picture.setRunning(true);
    tick(4000);
    expect(dot().style.transform).toBe(`translate(${last.x2}px, ${last.y}px)`);
  });
});
