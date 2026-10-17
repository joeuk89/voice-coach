/** A [from, to) slice of an animation loop, as fractions of the cycle. */
export type LoopWindow = [number, number];

/** The window to drive, or null when it is missing or covers the whole loop. */
export function activeWindow(window: LoopWindow | null | undefined): LoopWindow | null {
  if (!window) return null;
  const from = Math.max(0, window[0]);
  const to = Math.min(1, window[1]);
  if (from <= 0 && to >= 1) return null;
  return [from, Math.max(from, to)];
}

/** Keeps the clock this far inside each window edge, so a hard switch on the edge always reads as this window. */
const EDGE_MS = 1;

/** Loop time in ms after looping the window for `elapsedMs`, wrapping back to its start. */
export function windowTime([from, to]: LoopWindow, cycleMs: number, elapsedMs: number): number {
  const start = from * cycleMs;
  const span = (to - from) * cycleMs;
  if (span <= 0) return start;
  const edge = Math.min(EDGE_MS, span / 2);
  const offset = ((elapsedMs % span) + span) % span;
  return start + Math.min(Math.max(offset, edge), span - edge);
}

/** How far through the window a loop time is, from 0 to 1. */
export function windowProgress([from, to]: LoopWindow, cycleMs: number, loopTime: number): number {
  const span = (to - from) * cycleMs;
  if (span <= 0) return 0;
  return Math.min(Math.max((loopTime - from * cycleMs) / span, 0), 1);
}

/** Loops shorter than the cycle (air flow, rings, buzz) repeat on their own rhythm. */
export function isInnerLoop(durationMs: number, cycleMs: number): boolean {
  return durationMs < cycleMs - 1;
}

/**
 * The currentTime that shows an infinite animation as it looks `loopTime` into the cycle.
 * Inside its start delay it would render unstyled, so it moves on by whole iterations.
 */
export function animationTime(loopTime: number, durationMs: number, delayMs: number): number {
  if (loopTime >= delayMs || durationMs <= 0) return loopTime;
  return loopTime + Math.ceil((delayMs - loopTime) / durationMs) * durationMs;
}
