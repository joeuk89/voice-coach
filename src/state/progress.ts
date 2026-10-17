export type ExerciseState = 'done' | 'current' | 'upcoming';

/** What the user has finished this session: whole exercises, and sub-steps per exercise. */
export interface RoutineProgress {
  readonly exercises: Set<number>;
  readonly steps: Map<number, Set<number>>;
}

export function createProgress(): RoutineProgress {
  return { exercises: new Set(), steps: new Map() };
}

/**
 * A sub-step finishes when its timer reaches zero, its count completes, or Next is pressed on it.
 * Finishing the last sub-step finishes the exercise. Jumping over a sub-step never finishes it.
 */
export function finishStep(progress: RoutineProgress, exercise: number, subIndex: number, lastSubIndex: number): void {
  const steps = progress.steps.get(exercise) ?? new Set<number>();
  steps.add(subIndex);
  progress.steps.set(exercise, steps);
  if (subIndex === lastSubIndex) progress.exercises.add(exercise);
}

export function isStepFinished(progress: RoutineProgress, exercise: number, subIndex: number): boolean {
  return progress.steps.get(exercise)?.has(subIndex) ?? false;
}

export function exerciseState(progress: RoutineProgress, exercise: number, current: number): ExerciseState {
  if (progress.exercises.has(exercise)) return 'done';
  return exercise === current ? 'current' : 'upcoming';
}
