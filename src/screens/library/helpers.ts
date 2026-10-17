import { formatClock } from '../../lib/dom';
import type { PlannedSubStep } from '../../state/plan';

const LIBRARY_HASH = '#/library';

export function isLibraryHash(hash: string): boolean {
  return hash === LIBRARY_HASH || hash.startsWith(`${LIBRARY_HASH}/`);
}

/** The exercise id in `#/library/<id>`, or undefined for the list. */
export function libraryIdFromHash(hash: string): string | undefined {
  if (!hash.startsWith(`${LIBRARY_HASH}/`)) return undefined;
  return hash.slice(LIBRARY_HASH.length + 1) || undefined;
}

export function routineDurations(shortSec: number, fullSec: number): string {
  if (shortSec > 0 && fullSec > 0) return `Short ${formatClock(shortSec)} · Full ${formatClock(fullSec)}`;
  if (fullSec > 0) return 'Full only';
  if (shortSec > 0) return 'Short only';
  return 'Not in a routine';
}

export function shareLabel(planned: PlannedSubStep): string {
  if (planned.mode === 'untimed') return 'untimed';
  if (planned.mode === 'reps' || planned.mode === 'paced') return `× ${planned.reps}`;
  return formatClock(planned.seconds);
}
