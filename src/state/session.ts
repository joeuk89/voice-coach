import type { Exercise, RoutineId } from '../types';

export interface Step {
  exercise: Exercise;
  seconds: number;
}

export interface Session {
  routine: RoutineId;
  steps: Step[];
  index: number;
  subIndex: number;
  startedAt: number;
  logged: boolean;
}

let current: Session | null = null;

export function startSession(routine: RoutineId, steps: Step[]): Session {
  current = { routine, steps, index: 0, subIndex: 0, startedAt: Date.now(), logged: false };
  return current;
}

export function getSession(): Session | null {
  return current;
}

export function endSession(): void {
  current = null;
}
