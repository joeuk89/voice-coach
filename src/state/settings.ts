import { exercises } from '../exercises';
import type { Exercise, RoutineId, Settings } from '../types';
import { isFiniteNumber, isRecord, read, write } from './storage';

const KEY = 'settings';

export function defaultSettings(): Settings {
  return { routine: 'full', disabled: [], durations: { short: {}, full: {} } };
}

function secondsById(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, number] => isFiniteNumber(entry[1])),
  );
}

export function loadSettings(): Settings {
  const raw = read(KEY);
  const saved = isRecord(raw) ? raw : {};
  const durations = isRecord(saved['durations']) ? saved['durations'] : {};
  const disabled = Array.isArray(saved['disabled']) ? saved['disabled'] : defaultSettings().disabled;
  return {
    routine: saved['routine'] === 'short' ? 'short' : 'full',
    disabled: disabled.filter((id): id is string => typeof id === 'string'),
    durations: {
      short: secondsById(durations['short']),
      full: secondsById(durations['full']),
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
