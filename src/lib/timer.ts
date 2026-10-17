export interface Countdown {
  start(): void;
  pause(): void;
  toggle(): boolean;
  readonly running: boolean;
  /** Seconds actually spent running so far. */
  readonly elapsedSec: number;
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
  let spentMs = 0;
  let resumedAt = 0;

  function tick() {
    const left = endAt - Date.now();
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
    spentMs += Date.now() - resumedAt;
    if (interval) clearInterval(interval);
    interval = undefined;
  }

  const api: Countdown = {
    start() {
      if (running || remainingMs <= 0) return;
      running = true;
      resumedAt = Date.now();
      endAt = resumedAt + remainingMs;
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
    get elapsedSec() {
      const live = running ? Date.now() - resumedAt : 0;
      return Math.round((spentMs + live) / 1000);
    },
    stop() {
      halt();
    },
  };
  onTick(totalSec);
  return api;
}
