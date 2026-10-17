import { exercises } from '../exercises';
import type { Exercise, RepsExercise, RoutineId, Settings } from '../types';
import type { Step } from './session';
import { isFiniteNumber, isRecord, read, write } from './storage';

const KEY = 'settings';

export function defaultSettings(): Settings {
  return { routine: 'full', disabled: [], durations: { short: {}, full: {} }, reps: { short: {}, full: {} } };
}

function numbersById(value: unknown, min = -Infinity): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => isFiniteNumber(entry[1]) && entry[1] >= min),
  );
}

function byRoutine(value: unknown, min?: number): Record<RoutineId, Record<string, number>> {
  const routines = isRecord(value) ? value : {};
  return { short: numbersById(routines['short'], min), full: numbersById(routines['full'], min) };
}

export function loadSettings(): Settings {
  const raw = read(KEY);
  const saved = isRecord(raw) ? raw : {};
  const disabled = Array.isArray(saved['disabled']) ? saved['disabled'] : defaultSettings().disabled;
  return {
    routine: saved['routine'] === 'short' ? 'short' : 'full',
    disabled: disabled.filter((id): id is string => typeof id === 'string'),
    durations: byRoutine(saved['durations']),
    reps: byRoutine(saved['reps'], 1),
  };
}

export function resetSettings(settings: Settings): Settings {
  return { ...defaultSettings(), routine: settings.routine };
}

export function saveSettings(settings: Settings): void {
  write(KEY, settings);
}

/** The rep count a reps exercise runs for; undefined for other exercises. */
export function repsFor(exercise: RepsExercise, settings: Settings, routine?: RoutineId): number;
export function repsFor(exercise: Exercise, settings: Settings, routine?: RoutineId): number | undefined;
export function repsFor(exercise: Exercise, settings: Settings, routine: RoutineId = settings.routine): number | undefined {
  if (exercise.control !== 'reps') return undefined;
  return settings.reps[routine][exercise.id] ?? exercise.reps[routine];
}

/** Seconds the exercise takes in a routine: set in Settings when timed, reps × repSec when counted, nominal when untimed. */
export function durationFor(exercise: Exercise, settings: Settings, routine: RoutineId = settings.routine): number {
  if (exercise.control === 'reps') return repsFor(exercise, settings, routine) * exercise.repSec;
  if (exercise.control === 'untimed') return exercise.duration[routine];
  return settings.durations[routine][exercise.id] ?? exercise.duration[routine];
}

/** Exercises that will actually run for a routine, in order, with their effective durations and rep counts. */
export function planRoutine(settings: Settings, routine: RoutineId = settings.routine): Step[] {
  return exercises
    .filter((e) => !settings.disabled.includes(e.id))
    .map((exercise) => ({
      exercise,
      seconds: durationFor(exercise, settings, routine),
      reps: repsFor(exercise, settings, routine),
    }))
    .filter((step) => step.seconds > 0);
}

export function totalSeconds(settings: Settings, routine: RoutineId = settings.routine): number {
  return planRoutine(settings, routine).reduce((sum, step) => sum + step.seconds, 0);
}
