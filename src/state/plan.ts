import type { Exercise, SubStep } from '../types';

export type SubStepMode = 'timed' | 'reps' | 'untimed';

export interface PlannedSubStep {
  subStep: SubStep;
  mode: SubStepMode;
  seconds: number;
  reps?: number;
}

const UNIT_SEC = 5;
/** Treats fractional parts this close as tied, so float noise cannot beat the earliest-index rule. */
const TIE_EPSILON = 1e-9;

/** Largest-remainder split in 5-second units, so shares never go negative and add up exactly. */
function splitUnits(weights: number[], units: number): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + (w > 0 ? w : 0), 0);
  if (totalWeight === 0) return weights.map(() => 0);

  const exact = weights.map((w) => (w > 0 ? (units * w) / totalWeight : 0));
  const given = exact.map(Math.floor);
  const leftover = units - given.reduce((sum, u) => sum + u, 0);

  const frac = (i: number) => exact[i]! - given[i]!;
  const byRemainder = weights
    .map((w, i) => (w > 0 ? i : -1))
    .filter((i) => i >= 0)
    .sort((a, b) => (Math.abs(frac(b) - frac(a)) < TIE_EPSILON ? a - b : frac(b) - frac(a)));
  for (const i of byRemainder.slice(0, leftover)) given[i]! += 1;
  return given;
}

/** `exerciseReps` is the routine's rep count for a reps exercise; counted sub-steps without a fixed count use it. */
export function planSubSteps(exercise: Exercise, exerciseSeconds: number, exerciseReps?: number): PlannedSubStep[] {
  const weights = exercise.subSteps.map((s) => s.weight ?? (s.reps !== undefined ? 0 : 1));
  const units = splitUnits(weights, Math.floor(exerciseSeconds / UNIT_SEC));
  const routineReps = exercise.control === 'reps' ? exerciseReps : undefined;

  return exercise.subSteps.map((subStep, i) => {
    const seconds = units[i]! * UNIT_SEC;
    if (subStep.weight !== undefined && subStep.weight <= 0) return { subStep, mode: 'untimed', seconds: 0 };
    if (subStep.reps !== undefined) return { subStep, mode: 'reps', seconds, reps: subStep.reps };
    if (subStep.repSec !== undefined) {
      return { subStep, mode: 'reps', seconds, reps: routineReps ?? Math.max(1, Math.round(seconds / subStep.repSec)) };
    }
    return { subStep, mode: 'timed', seconds };
  });
}
