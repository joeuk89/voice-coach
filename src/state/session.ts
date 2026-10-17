import type { Exercise, RoutineId } from '../types';
import { createProgress, type RoutineProgress } from './progress';

export interface Step {
  exercise: Exercise;
  seconds: number;
  /** The rep count for a reps exercise, which the planner hands to its counted sub-steps. */
  reps?: number;
}

export interface Session {
  routine: RoutineId;
  steps: Step[];
  index: number;
  subIndex: number;
  progress: RoutineProgress;
  startedAt: number;
  /** Set once the Done screen has written the log entry. */
  logged: { completedAt: string; saved: boolean } | null;
}

let current: Session | null = null;

export function startSession(routine: RoutineId, steps: Step[]): Session {
  current = { routine, steps, index: 0, subIndex: 0, progress: createProgress(), startedAt: Date.now(), logged: null };
  return current;
}

export function getSession(): Session | null {
  return current;
}

export function endSession(): void {
  current = null;
}
