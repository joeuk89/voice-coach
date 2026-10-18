import { formatClock } from '../../lib/dom';
import { daysPhrase, formatDays, joinAnd } from '../../lib/weekdays';
import type { PlannedSubStep } from '../../state/plan';
import type { RoutineId, Weekday } from '../../types';

const LIBRARY_HASH = '#/library';

export function isLibraryHash(hash: string): boolean {
  return hash === LIBRARY_HASH || hash.startsWith(`${LIBRARY_HASH}/`);
}

/** The exercise id in `#/library/<id>`, or undefined for the list. */
export function libraryIdFromHash(hash: string): string | undefined {
  if (!hash.startsWith(`${LIBRARY_HASH}/`)) return undefined;
  return hash.slice(LIBRARY_HASH.length + 1) || undefined;
}

/** An exercise's time and days in one routine. */
export interface RoutineSlot {
  seconds: number;
  days: readonly Weekday[];
}

/** A routine's slot is undefined when the exercise is switched off there. */
export type RoutineSlots = Partial<Record<RoutineId, RoutineSlot>>;

const ROUTINE_NAMES: Record<RoutineId, string> = { short: 'Short', full: 'Full' };
const ROUTINES: RoutineId[] = ['short', 'full'];

/** The days, unless they are every day. */
function daysSuffix(slot: RoutineSlot): string {
  const days = formatDays(slot.days);
  return days === 'Every day' ? '' : days;
}

/** "Short 4:00 Mon, Wed, Fri · Full 4:00", "Short only · Mon, Wed, Fri", or "Not in a routine". */
export function routineDurations({ short, full }: RoutineSlots): string {
  if (short && full) {
    const part = (name: string, slot: RoutineSlot) => [name, formatClock(slot.seconds), daysSuffix(slot)].filter(Boolean).join(' ');
    return `${part('Short', short)} · ${part('Full', full)}`;
  }
  const only = short ? { name: 'Short', slot: short } : full ? { name: 'Full', slot: full } : undefined;
  if (!only) return 'Not in a routine';
  return [`${only.name} only`, daysSuffix(only.slot)].filter(Boolean).join(' · ');
}

/**
 * One sentence on the days the exercise runs in each routine it is in, such as "Runs Mon, Wed and Fri
 * in Short and every day in Full.", or '' when it runs every day wherever it is on. Routines with the
 * same days share a clause.
 */
export function scheduleSentence(slots: RoutineSlots): string {
  const clauses = new Map<string, string[]>();
  let everyDay = true;
  for (const routine of ROUTINES) {
    const slot = slots[routine];
    if (!slot) continue;
    if (daysSuffix(slot)) everyDay = false;
    const phrase = daysPhrase(slot.days);
    clauses.set(phrase, [...(clauses.get(phrase) ?? []), ROUTINE_NAMES[routine]]);
  }
  if (everyDay) return '';
  return `Runs ${joinAnd([...clauses].map(([phrase, names]) => `${phrase} in ${joinAnd(names)}`))}.`;
}

export function shareLabel(planned: PlannedSubStep): string {
  if (planned.mode === 'untimed') return 'untimed';
  if (planned.mode === 'reps' || planned.mode === 'paced') return `× ${planned.reps}`;
  return formatClock(planned.seconds);
}
