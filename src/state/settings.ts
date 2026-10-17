import { exercises } from '../exercises';
import type { Exercise, RepsExercise, RoutineId, Settings } from '../types';
import type { Step } from './session';
import { isFiniteNumber, isRecord, read, write } from './storage';

const KEY = 'settings';
const ROUTINES: RoutineId[] = ['short', 'full'];
export const MIN_SECONDS = 30;

function defaultOff(routine: RoutineId): string[] {
  return exercises.filter((e) => e.defaultOff?.includes(routine)).map((e) => e.id);
}

export function defaultSettings(): Settings {
  return {
    routine: 'full',
    disabled: { short: defaultOff('short'), full: defaultOff('full') },
    durations: { short: {}, full: {} },
    reps: { short: {}, full: {} },
  };
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

function strings(values: unknown[]): string[] {
  return [...new Set(values.filter((id): id is string => typeof id === 'string'))];
}

/**
 * Older saves kept one flat list, which switched an exercise off in both routines. They left the
 * default-off exercises out of Short with a time of 0, so one with a saved time there was added back.
 */
function loadDisabled(value: unknown, savedDurations: unknown): Record<RoutineId, string[]> {
  const defaults = defaultSettings().disabled;
  if (Array.isArray(value)) {
    const times = byRoutine(savedDurations);
    const stillOff = (r: RoutineId) => defaults[r].filter((id) => !((times[r][id] ?? 0) > 0));
    return { short: strings([...stillOff('short'), ...value]), full: strings([...stillOff('full'), ...value]) };
  }
  const routines = isRecord(value) ? value : {};
  const list = (r: RoutineId) => {
    const saved = routines[r];
    return Array.isArray(saved) ? strings(saved) : defaults[r];
  };
  return { short: list('short'), full: list('full') };
}

function takesSavedTime(id: string): boolean {
  const exercise = exercises.find((e) => e.id === id);
  return exercise !== undefined && exercise.control !== 'reps' && exercise.control !== 'untimed';
}

/**
 * Older saves left a timed exercise out of a routine with a time of 0; that becomes the switch.
 * A 0 on a counted or untimed exercise never applied, so it is only dropped.
 */
function loadDurations(value: unknown, disabled: Record<RoutineId, string[]>): Record<RoutineId, Record<string, number>> {
  const durations = byRoutine(value, 0);
  for (const routine of ROUTINES) {
    for (const [id, secs] of Object.entries(durations[routine])) {
      if (secs > 0) {
        durations[routine][id] = Math.max(MIN_SECONDS, secs);
        continue;
      }
      delete durations[routine][id];
      if (takesSavedTime(id) && !disabled[routine].includes(id)) disabled[routine].push(id);
    }
  }
  return durations;
}

export function loadSettings(): Settings {
  const raw = read(KEY);
  const saved = isRecord(raw) ? raw : {};
  const disabled = loadDisabled(saved['disabled'], saved['durations']);
  return {
    routine: saved['routine'] === 'short' ? 'short' : 'full',
    disabled,
    durations: loadDurations(saved['durations'], disabled),
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

export function isOn(exercise: Exercise, settings: Settings, routine: RoutineId = settings.routine): boolean {
  return !settings.disabled[routine].includes(exercise.id);
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
    .filter((e) => isOn(e, settings, routine))
    .map((exercise) => ({
      exercise,
      seconds: durationFor(exercise, settings, routine),
      reps: repsFor(exercise, settings, routine),
    }));
}

export function totalSeconds(settings: Settings, routine: RoutineId = settings.routine): number {
  return planRoutine(settings, routine).reduce((sum, step) => sum + step.seconds, 0);
}
