import type { Exercise, RoutineId } from '../types';

export interface Step {
  exercise: Exercise;
  seconds: number;
}

export interface Session {
  routine: RoutineId;
  steps: Step[];
  index: number;
  startedAt: number;
  /** Seconds spent on finished steps, including skipped time actually elapsed. */
  elapsedSec: number;
  logged: boolean;
}

let current: Session | null = null;

export function startSession(routine: RoutineId, steps: Step[]): Session {
  current = { routine, steps, index: 0, startedAt: Date.now(), elapsedSec: 0, logged: false };
  return current;
}

export function getSession(): Session | null {
  return current;
}

export function endSession(): void {
  current = null;
}
