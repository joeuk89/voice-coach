let sentinel: WakeLockSentinel | null = null;
let wanted = false;

async function request(): Promise<void> {
  if (!wanted || sentinel || !('wakeLock' in navigator)) return;
  try {
    const lock = await navigator.wakeLock.request('screen');
    if (!wanted || sentinel) {
      lock.release().catch(() => undefined);
      return;
    }
    sentinel = lock;
    // The browser releases the lock whenever the page is hidden.
    lock.addEventListener('release', () => {
      if (sentinel === lock) sentinel = null;
    });
  } catch {
    // Refused, for example in power-saving mode: the screen sleeps as normal.
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void request();
});

export function keepAwake(): void {
  wanted = true;
  void request();
}

export function allowSleep(): void {
  wanted = false;
  sentinel?.release().catch(() => undefined);
  sentinel = null;
}
