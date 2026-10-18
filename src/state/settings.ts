import { exercises } from '../exercises';
import { ALL_DAYS, isWeekday } from '../lib/weekdays';
import type { Exercise, RepsExercise, RoutineId, Settings, Weekday } from '../types';
import type { Step } from './session';
import { isFiniteNumber, isRecord, read, write } from './storage';

const KEY = 'settings';
const ROUTINES: RoutineId[] = ['short', 'full'];
export const MIN_SECONDS = 30;

/**
 * Before the schedule, the vocal function exercises and the read-aloud started switched off in Short,
 * and every save listed them in its Short off list whether or not the user had chosen that. A save
 * without `days` predates the schedule, so these two leave its Short list and the schedule takes over.
 */
const PRE_SCHEDULE_SHORT_OFF = ['vfe', 'read-aloud'];

/** Integer days 0 to 6, deduplicated and sorted; undefined when nothing valid is left. */
function cleanDays(value: unknown): Weekday[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const days = [...new Set(value.filter(isWeekday))].sort((a, b) => a - b);
  return days.length ? days : undefined;
}

function isEveryDay(days: readonly Weekday[]): boolean {
  return days.length === ALL_DAYS.length;
}

/** The days an exercise declares for a routine, or every day. */
function exerciseDays(exercise: Exercise, routine: RoutineId): Weekday[] {
  return cleanDays(exercise.days?.[routine]) ?? [...ALL_DAYS];
}

/** Only exercises that do not run every day get an entry, which keeps the save small. */
function defaultDays(routine: RoutineId): Record<string, Weekday[]> {
  const days: Record<string, Weekday[]> = {};
  for (const exercise of exercises) {
    const list = exerciseDays(exercise, routine);
    if (!isEveryDay(list)) days[exercise.id] = list;
  }
  return days;
}

export function defaultSettings(): Settings {
  return {
    routine: 'full',
    disabled: { short: [], full: [] },
    durations: { short: {}, full: {} },
    reps: { short: {}, full: {} },
    days: { short: defaultDays('short'), full: defaultDays('full') },
  };
}

/** An id from a save is only kept while the exercise still exists. */
function isExerciseId(id: string): boolean {
  return exercises.some((e) => e.id === id);
}

function numbersById(value: unknown, min = -Infinity): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => isExerciseId(entry[0]) && isFiniteNumber(entry[1]) && entry[1] >= min,
    ),
  );
}

function byRoutine(value: unknown, min?: number): Record<RoutineId, Record<string, number>> {
  const routines = isRecord(value) ? value : {};
  return { short: numbersById(routines['short'], min), full: numbersById(routines['full'], min) };
}

function strings(values: unknown[]): string[] {
  return [...new Set(values.filter((id): id is string => typeof id === 'string' && isExerciseId(id)))];
}

/**
 * Older saves kept one flat list, which switched an exercise off in both routines. A missing or
 * malformed routine list falls back to the default, which is nothing off.
 */
function loadDisabled(value: unknown, preSchedule: boolean): Record<RoutineId, string[]> {
  if (Array.isArray(value)) {
    const off = strings(value);
    return { short: off, full: [...off] };
  }
  const routines = isRecord(value) ? value : {};
  const list = (r: RoutineId) => {
    const saved = routines[r];
    return Array.isArray(saved) ? strings(saved) : [];
  };
  const short = list('short');
  return {
    short: preSchedule ? short.filter((id) => !PRE_SCHEDULE_SHORT_OFF.includes(id)) : short,
    full: list('full'),
  };
}

/**
 * Each saved list is cleaned; one with nothing valid left falls back to the exercise's default.
 * A list of all seven days is dropped, as no entry means every day. A missing or malformed
 * routine falls back to that routine's defaults.
 */
function loadDays(value: unknown): Record<RoutineId, Record<string, Weekday[]>> {
  const routines = isRecord(value) ? value : {};
  const forRoutine = (routine: RoutineId) => {
    const saved = routines[routine];
    if (!isRecord(saved)) return defaultDays(routine);
    const days: Record<string, Weekday[]> = {};
    for (const [id, list] of Object.entries(saved)) {
      const exercise = exercises.find((e) => e.id === id);
      if (!exercise) continue;
      const parsed = cleanDays(list) ?? exerciseDays(exercise, routine);
      if (!isEveryDay(parsed)) days[id] = parsed;
    }
    return days;
  };
  return { short: forRoutine('short'), full: forRoutine('full') };
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

/** Reads the save, and writes it back when loading changed it, so a migration or a dropped id happens once. */
export function loadSettings(): Settings {
  const raw = read(KEY);
  const saved = isRecord(raw) ? raw : {};
  const disabled = loadDisabled(saved['disabled'], saved['days'] === undefined);
  const settings: Settings = {
    routine: saved['routine'] === 'short' ? 'short' : 'full',
    disabled,
    durations: loadDurations(saved['durations'], disabled),
    reps: byRoutine(saved['reps'], 1),
    days: loadDays(saved['days']),
  };
  if (raw !== undefined && raw !== null && JSON.stringify(raw) !== JSON.stringify(settings)) saveSettings(settings);
  return settings;
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

/** The exercise's switch is on in the routine, whatever its days. */
export function isOn(exercise: Exercise, settings: Settings, routine: RoutineId = settings.routine): boolean {
  return !settings.disabled[routine].includes(exercise.id);
}

/** The days the exercise runs on in a routine, sorted from Sunday. */
export function daysFor(exercise: Exercise, settings: Settings, routine: RoutineId = settings.routine): Weekday[] {
  return settings.days[routine][exercise.id] ?? [...ALL_DAYS];
}

/** The switch is on in the routine and the day is one of its days. */
export function runsOn(exercise: Exercise, settings: Settings, routine: RoutineId, weekday: Weekday): boolean {
  return isOn(exercise, settings, routine) && daysFor(exercise, settings, routine).includes(weekday);
}

/**
 * Turns one day on or off for an exercise in a routine. The last day stays on, because the switch is
 * how an exercise leaves a routine. Every day removes the entry, as no entry means every day.
 */
export function toggleDay(exercise: Exercise, settings: Settings, routine: RoutineId, day: Weekday): void {
  const current = daysFor(exercise, settings, routine);
  const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b);
  if (next.length === 0) return;
  if (isEveryDay(next)) delete settings.days[routine][exercise.id];
  else settings.days[routine][exercise.id] = next;
}

function weekdayOf(date: Date): Weekday {
  return date.getDay() as Weekday;
}

/** Seconds the exercise takes in a routine: set in Settings when timed, reps × repSec when counted, nominal when untimed. */
export function durationFor(exercise: Exercise, settings: Settings, routine: RoutineId = settings.routine): number {
  if (exercise.control === 'reps') return repsFor(exercise, settings, routine) * exercise.repSec;
  if (exercise.control === 'untimed') return exercise.duration[routine];
  return settings.durations[routine][exercise.id] ?? exercise.duration[routine];
}

/** Exercises that will actually run for a routine on the date's weekday, in order, with their effective durations and rep counts. */
export function planRoutine(settings: Settings, routine: RoutineId = settings.routine, date = new Date()): Step[] {
  return exercises
    .filter((e) => runsOn(e, settings, routine, weekdayOf(date)))
    .map((exercise) => ({
      exercise,
      seconds: durationFor(exercise, settings, routine),
      reps: repsFor(exercise, settings, routine),
    }));
}

/** Exercises switched on in the routine that are not scheduled on the date's weekday. */
export function restingOn(settings: Settings, routine: RoutineId = settings.routine, date = new Date()): Exercise[] {
  return exercises.filter((e) => isOn(e, settings, routine) && !runsOn(e, settings, routine, weekdayOf(date)));
}

export function totalSeconds(settings: Settings, routine: RoutineId = settings.routine, date = new Date()): number {
  return planRoutine(settings, routine, date).reduce((sum, step) => sum + step.seconds, 0);
}
