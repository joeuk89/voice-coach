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
  /** Fraction of the animation loop to play, [from, to). Default whole loop. */
  window?: [number, number];
}

export interface Exercise {
  id: string;
  name: string;
  purpose: string;
  subSteps: SubStep[];
  tips?: string[];
  /** Seconds per routine. 0 leaves the exercise out of that routine. */
  duration: Record<RoutineId, number>;
  animation: AnimationId | null;
  /** 'audio' plays a bundled track instead of running a countdown. */
  kind?: 'timed' | 'audio';
  /** Extra interactive panel under the sub-steps. */
  panel?: 'sustain' | 'reading';
  audioSrc?: string;
  links: Link[];
}

export type Feeling = 'strong' | 'ok' | 'strained';

export interface LogEntry {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  completedAt: string;
  routine: RoutineId;
  totalSec: number;
  feeling?: Feeling;
}

export interface Settings {
  routine: RoutineId;
  disabled: string[];
  durations: Record<RoutineId, Record<string, number>>;
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
  phases: Phase[];
}
