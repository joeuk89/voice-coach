export interface Countdown {
  start(): void;
  pause(): void;
  toggle(): boolean;
  readonly running: boolean;
  stop(): void;
}

export function createCountdown(
  totalSec: number,
  onTick: (remainingSec: number) => void,
  onDone: () => void,
): Countdown {
  let remainingMs = totalSec * 1000;
  let endAt = 0;
  let interval: ReturnType<typeof setInterval> | undefined;
  let running = false;

  function tick() {
    const left = endAt - performance.now();
    if (left <= 0) {
      remainingMs = 0;
      halt();
      onTick(0);
      onDone();
      return;
    }
    remainingMs = left;
    onTick(Math.ceil(left / 1000));
  }

  function halt() {
    if (!running) return;
    running = false;
    remainingMs = Math.max(0, endAt - performance.now());
    if (interval) clearInterval(interval);
    interval = undefined;
  }

  const api: Countdown = {
    start() {
      if (running || remainingMs <= 0) return;
      running = true;
      endAt = performance.now() + remainingMs;
      interval = setInterval(tick, 200);
      onTick(Math.ceil(remainingMs / 1000));
    },
    pause() {
      halt();
    },
    toggle() {
      if (running) api.pause();
      else api.start();
      return running;
    },
    get running() {
      return running;
    },
    stop() {
      halt();
    },
  };
  onTick(totalSec);
  return api;
}
