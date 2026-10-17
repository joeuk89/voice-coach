import { exercises } from '../exercises';
import type { Exercise, RoutineId, Settings } from '../types';
import { read, write } from './storage';

const KEY = 'settings';

export function defaultSettings(): Settings {
  return { routine: 'full', disabled: [], durations: { short: {}, full: {} } };
}

export function loadSettings(): Settings {
  const saved = read<Partial<Settings>>(KEY, {});
  const base = defaultSettings();
  return {
    routine: saved.routine === 'short' ? 'short' : 'full',
    disabled: Array.isArray(saved.disabled) ? saved.disabled : base.disabled,
    durations: {
      short: { ...saved.durations?.short },
      full: { ...saved.durations?.full },
    },
  };
}

export function saveSettings(settings: Settings): void {
  write(KEY, settings);
}

export function durationFor(exercise: Exercise, settings: Settings, routine: RoutineId = settings.routine): number {
  const override = settings.durations[routine][exercise.id];
  return typeof override === 'number' ? override : exercise.duration[routine];
}

/** Exercises that will actually run for a routine, in order, with their effective durations. */
export function planRoutine(settings: Settings, routine: RoutineId = settings.routine): { exercise: Exercise; seconds: number }[] {
  return exercises
    .filter((e) => !settings.disabled.includes(e.id))
    .map((exercise) => ({ exercise, seconds: durationFor(exercise, settings, routine) }))
    .filter((step) => step.seconds > 0);
}

export function totalSeconds(settings: Settings, routine: RoutineId = settings.routine): number {
  return planRoutine(settings, routine).reduce((sum, step) => sum + step.seconds, 0);
}
