export type RoutineId = 'short' | 'full';

export type AnimationId =
  | 'low-breathing'
  | 'straw'
  | 'lip-trills'
  | 'sirens'
  | 'hum'
  | 'vfe'
  | 'read-aloud';

export interface Link {
  label: string;
  url: string;
}

export interface SubStep {
  text: string;
  /** Share of the exercise duration relative to the other sub-steps. 0 means untimed. Default 1. */
  weight?: number;
  /** Fixed number of reps, for protocol-defined counts. */
  reps?: number;
  /** Seconds one rep takes; the rep count is derived from the time share. */
  repSec?: number;
  /** Reps sung on each pitch before moving up; the rep counter then names the current pitch. */
  repsPerPitch?: number;
  /** Fraction of the animation loop to play, [from, to). Default whole loop. */
  window?: [number, number];
  /** Words or sounds to try during the sub-step, shown as chips under its text. */
  examples?: string[];
}

interface ExerciseBase {
  id: string;
  name: string;
  purpose: string;
  subSteps: SubStep[];
  tips?: string[];
  animation: AnimationId | null;
  /** 'audio' plays a bundled track instead of running a countdown. */
  kind?: 'audio';
  /** Extra interactive panel under the sub-steps. */
  panel?: 'sustain' | 'reading';
  audioSrc?: string;
  links: Link[];
}

/** Runs for a set time that Settings can change. */
export interface TimedExercise extends ExerciseBase {
  control?: 'timed';
  /** Seconds per routine. 0 leaves the exercise out of that routine. */
  duration: Record<RoutineId, number>;
}

/** Runs for as long as it takes; `duration` is only the time it usually takes. */
export interface UntimedExercise extends ExerciseBase {
  control: 'untimed';
  duration: Record<RoutineId, number>;
}

/** Counted in reps that Settings can change; its time is reps × `repSec`. */
export interface RepsExercise extends ExerciseBase {
  control: 'reps';
  /** Reps per routine. 0 leaves the exercise out of that routine. */
  reps: Record<RoutineId, number>;
  repSec: number;
  /** What one rep is called, singular ("breath"); Settings adds an "s" for more than one. */
  repNoun: string;
}

export type Exercise = TimedExercise | UntimedExercise | RepsExercise;

export type Feeling = 'strong' | 'ok' | 'strained';

export interface LogEntry {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  completedAt: string;
  routine: RoutineId;
  totalSec: number;
  /** Exercises in the routine; missing on entries saved before it was recorded. */
  steps?: number;
  feeling?: Feeling;
}

export interface Settings {
  routine: RoutineId;
  disabled: string[];
  durations: Record<RoutineId, Record<string, number>>;
  reps: Record<RoutineId, Record<string, number>>;
}

export interface Phase {
  /** End of this phase as a fraction of the loop, ascending, last one 1. */
  until: number;
  caption: string;
}

export interface AnimationDef {
  id: AnimationId;
  cycleSec: number;
  svg: string;
  /** A tighter crop for the guided screen when a panel shares it, so the card shrinks without shrinking the labels. */
  compactViewBox?: string;
  phases: Phase[];
}
