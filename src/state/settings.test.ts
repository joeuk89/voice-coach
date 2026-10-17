import { beforeEach, describe, expect, it } from 'vitest';
import { exercises } from '../exercises';
import { stubLocalStorage } from '../test/local-storage';
import { defaultSettings, durationFor, loadSettings, planRoutine } from './settings';

let storage: Storage;

beforeEach(() => {
  storage = stubLocalStorage();
});

function saved(value: string) {
  storage.setItem('vt.settings', value);
  return loadSettings();
}

describe('loadSettings', () => {
  it('returns the defaults when nothing is saved', () => {
    expect(loadSettings()).toEqual(defaultSettings());
  });

  it('returns the defaults for null and non-objects', () => {
    expect(saved('null')).toEqual(defaultSettings());
    expect(saved('[1, 2]')).toEqual(defaultSettings());
    expect(saved('"short"')).toEqual(defaultSettings());
  });

  it('fills in what a partial save leaves out', () => {
    expect(saved('{"routine":"short"}')).toEqual({ ...defaultSettings(), routine: 'short' });
  });

  it('drops values of the wrong type', () => {
    const settings = saved(
      JSON.stringify({ routine: 3, disabled: ['hum', 4], durations: { short: { hum: 'x', straw: 30 }, full: null } }),
    );
    expect(settings).toEqual({ routine: 'full', disabled: ['hum'], durations: { short: { straw: 30 }, full: {} } });
  });

  it('ignores a disabled list that is not an array', () => {
    expect(saved('{"disabled":"hum"}').disabled).toEqual([]);
  });
});

describe('durationFor', () => {
  const exercise = exercises[0]!;

  it('uses the exercise default without an override', () => {
    expect(durationFor(exercise, defaultSettings(), 'full')).toBe(exercise.duration.full);
  });

  it('uses the override for that routine only', () => {
    const settings = defaultSettings();
    settings.durations.short[exercise.id] = 45;
    expect(durationFor(exercise, settings, 'short')).toBe(45);
    expect(durationFor(exercise, settings, 'full')).toBe(exercise.duration.full);
  });
});

describe('planRoutine', () => {
  const ids = (settings = defaultSettings()) => planRoutine(settings, 'full').map((s) => s.exercise.id);
  const [first, second] = exercises.filter((e) => e.duration.full > 0);

  it('drops disabled exercises', () => {
    const settings = defaultSettings();
    settings.disabled = [first!.id];
    expect(ids(settings)).not.toContain(first!.id);
    expect(ids(settings)).toContain(second!.id);
  });

  it('drops exercises set to zero seconds', () => {
    const settings = defaultSettings();
    settings.durations.full[second!.id] = 0;
    expect(ids(settings)).not.toContain(second!.id);
    expect(ids(settings)).toContain(first!.id);
  });
});
