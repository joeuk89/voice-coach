import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCountdown } from './timer';

let now = 0;

beforeEach(() => {
  now = 0;
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  vi.spyOn(performance, 'now').mockImplementation(() => now);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function advance(ms: number) {
  now += ms;
  vi.advanceTimersByTime(ms);
}

function setup(totalSec: number) {
  const onTick = vi.fn<(left: number) => void>();
  const onDone = vi.fn();
  const timer = createCountdown(totalSec, onTick, onDone);
  const lastTick = () => onTick.mock.lastCall?.[0];
  return { timer, onTick, onDone, lastTick };
}

describe('createCountdown', () => {
  it('shows the full time before it starts', () => {
    const { timer, lastTick } = setup(10);
    expect(lastTick()).toBe(10);
    expect(timer.running).toBe(false);
  });

  it('counts down once started', () => {
    const { timer, lastTick } = setup(10);
    timer.start();
    advance(3000);
    expect(timer.running).toBe(true);
    expect(lastTick()).toBe(7);
  });

  it('rounds the seconds left up', () => {
    const { timer, lastTick } = setup(10);
    timer.start();
    advance(3100);
    expect(lastTick()).toBe(7);
  });

  it('holds its place while paused and carries on after resume', () => {
    const { timer, lastTick } = setup(10);
    timer.start();
    advance(4000);
    timer.pause();
    advance(60_000);
    expect(lastTick()).toBe(6);
    expect(timer.toggle()).toBe(true);
    advance(2000);
    expect(lastTick()).toBe(4);
  });

  it('calls onDone once at zero and stops', () => {
    const { timer, onDone, lastTick } = setup(2);
    timer.start();
    advance(2000);
    advance(2000);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(lastTick()).toBe(0);
    expect(timer.running).toBe(false);
  });

  it('does not start again once done', () => {
    const { timer } = setup(1);
    timer.start();
    advance(1000);
    timer.start();
    expect(timer.running).toBe(false);
  });
});
