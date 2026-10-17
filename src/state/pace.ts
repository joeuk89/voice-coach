import type { Pace } from '../types';

export const LEAD_IN_SEC = 3;

export interface PaceMoment {
  phase: 'ready' | 'in' | 'out' | 'done';
  /** Zero-based breath in progress, or the one the lead-in leads to; `total` once done. */
  breath: number;
  /** Whole seconds left in the lead-in or the current phase, counting down to 1. */
  secondsLeft: number;
  /** Time into the current breath, 0 outside one. */
  breathMs: number;
}

const wholeSeconds = (ms: number) => Math.ceil(ms / 1000);

/** Where a paced run is `elapsedMs` after Start or Resume: a lead-in, then breaths `from` to `total - 1`, each in then out. */
export function paceAt(elapsedMs: number, pace: Pace, total: number, from = 0): PaceMoment {
  const leadInMs = LEAD_IN_SEC * 1000;
  if (elapsedMs < leadInMs) return { phase: 'ready', breath: from, secondsLeft: wholeSeconds(leadInMs - elapsedMs), breathMs: 0 };

  const inMs = pace.inSec * 1000;
  const breathLength = inMs + pace.outSec * 1000;
  const sinceLeadIn = elapsedMs - leadInMs;
  const breath = from + Math.floor(sinceLeadIn / breathLength);
  if (breath >= total) return { phase: 'done', breath: total, secondsLeft: 0, breathMs: 0 };

  const breathMs = sinceLeadIn % breathLength;
  if (breathMs < inMs) return { phase: 'in', breath, secondsLeft: wholeSeconds(inMs - breathMs), breathMs };
  return { phase: 'out', breath, secondsLeft: wholeSeconds(breathLength - breathMs), breathMs };
}
