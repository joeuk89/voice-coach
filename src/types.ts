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

export interface Exercise {
  id: string;
  name: string;
  purpose: string;
  cues: string[];
  tips?: string[];
  /** Seconds per routine. 0 leaves the exercise out of that routine. */
  duration: Record<RoutineId, number>;
  animation: AnimationId | null;
  /** 'audio' plays a bundled track instead of running a countdown. */
  kind?: 'timed' | 'audio';
  /** Extra interactive panel under the cues. */
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
