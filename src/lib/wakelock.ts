let sentinel: WakeLockSentinel | null = null;
let wanted = false;

async function request(): Promise<void> {
  if (!wanted || !('wakeLock' in navigator)) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
  } catch {
    sentinel = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wanted && !sentinel) void request();
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
