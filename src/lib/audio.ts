let ctx: AudioContext | null = null;

/** Call from a user gesture (the Start button) so later cues are allowed to play. */
export function initAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function playCue(): void {
  if (!ctx) return;
  const t = ctx.currentTime + 0.02;
  tone(660, t, 0.18);
  tone(880, t + 0.22, 0.3);
}

function tone(freq: number, at: number, dur: number): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(0.22, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}
