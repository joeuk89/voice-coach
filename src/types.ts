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

export interface Pace {
  inSec: number;
  outSec: number;
}

export interface SubStep {
  text: string;
  /** Share of the exercise duration relative to the other sub-steps. 0 means untimed. Default 1, or 0 with a fixed `reps`. */
  weight?: number;
  /** Fixed number of reps, for protocol-defined counts. Takes no time share unless `weight` is set. */
  reps?: number;
  /** Seconds one rep takes; the rep count is derived from the time share. */
  repSec?: number;
  /** Breathe in and out for these seconds while the app paces each breath. Takes no time share unless `weight` is set. */
  pace?: Pace;
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
  /** Routines the exercise starts switched off in, until Settings turns it on. */
  defaultOff?: RoutineId[];
}

/** Runs for a set time that Settings can change. */
export interface TimedExercise extends ExerciseBase {
  control?: 'timed';
  /** Seconds per routine, 30 or more. */
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
  /** Reps per routine, 1 or more. */
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
  /** Ids of the exercises switched off in each routine. */
  disabled: Record<RoutineId, string[]>;
  durations: Record<RoutineId, Record<string, number>>;
  reps: Record<RoutineId, Record<string, number>>;
}

export interface Phase {
  /** End of this phase as a fraction of the loop, ascending, last one 1. */
  until: number;
  caption: string;
}

/** A picture that follows recorded holds instead of the clock, for a hold-counted sub-step. */
export interface HoldPicture {
  /** Holds recorded so far. The picture moves on to the next hold, or back after an Undo. */
  setCount(count: number): void;
  /** A hold is running: the picture draws it until it stops. */
  setRunning(running: boolean): void;
  stop(): void;
}

export interface AnimationDef {
  id: AnimationId;
  cycleSec: number;
  /** Inline SVG, or a function that builds it from an input such as a passage's demo line. */
  svg: string | ((input?: string) => string);
  /** A tighter crop for the guided screen when a panel shares it, so the card shrinks without shrinking the labels. */
  compactViewBox?: string;
  phases: Phase[];
  /**
   * Mounts a hold-driven picture over the card for a sub-step with `repsPerPitch`: the player is
   * parked at the start of the sub-step's `window` and the picture follows the hold counter.
   */
  holdPicture?: (container: HTMLElement, player: HoldPlayer, window: [number, number], repsPerPitch: number) => HoldPicture;
}

/** The part of the animation player a hold picture needs. */
export interface HoldPlayer {
  setWindow(window: [number, number] | null | undefined): void;
}
