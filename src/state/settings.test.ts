import { beforeEach, describe, expect, it } from 'vitest';
import { exercises } from '../exercises';
import { stubLocalStorage } from '../test/local-storage';
import { defaultSettings, durationFor, loadSettings, planRoutine, repsFor, resetSettings, totalSeconds } from './settings';

let storage: Storage;
const byId = (id: string) => exercises.find((e) => e.id === id)!;

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
    expect(settings).toEqual({
      routine: 'full',
      disabled: ['hum'],
      durations: { short: { straw: 30 }, full: {} },
      reps: { short: {}, full: {} },
    });
  });

  it('keeps saved rep counts per routine', () => {
    expect(saved('{"reps":{"short":{"low-breathing":3},"full":{"low-breathing":10}}}').reps).toEqual({
      short: { 'low-breathing': 3 },
      full: { 'low-breathing': 10 },
    });
  });

  it('drops rep counts that are not finite numbers or are below 1', () => {
    const settings = saved(JSON.stringify({ reps: { short: { a: 'x', b: 0, c: -2, d: 0.5, e: 1 }, full: [4] } }));
    expect(settings.reps).toEqual({ short: { e: 1 }, full: {} });
    expect(saved('{"reps":7}').reps).toEqual({ short: {}, full: {} });
  });

  it('ignores a disabled list that is not an array', () => {
    expect(saved('{"disabled":"hum"}').disabled).toEqual([]);
  });
});

describe('durationFor', () => {
  it('uses a timed exercise default without an override', () => {
    expect(durationFor(byId('straw'), defaultSettings(), 'full')).toBe(180);
  });

  it('uses the override for that routine only', () => {
    const settings = defaultSettings();
    settings.durations.short['straw'] = 45;
    expect(durationFor(byId('straw'), settings, 'short')).toBe(45);
    expect(durationFor(byId('straw'), settings, 'full')).toBe(180);
  });

  it('gives a rep exercise its rep count times the seconds per rep', () => {
    expect(durationFor(byId('low-breathing'), defaultSettings(), 'short')).toBe(60);
    expect(durationFor(byId('low-breathing'), defaultSettings(), 'full')).toBe(96);
  });

  it('follows a rep override for that routine only', () => {
    const settings = defaultSettings();
    settings.reps.full['low-breathing'] = 10;
    expect(durationFor(byId('low-breathing'), settings, 'full')).toBe(120);
    expect(durationFor(byId('low-breathing'), settings, 'short')).toBe(60);
  });

  it('ignores duration overrides on rep and untimed exercises', () => {
    const settings = defaultSettings();
    settings.durations.full['low-breathing'] = 300;
    settings.durations.full['read-aloud'] = 0;
    expect(durationFor(byId('low-breathing'), settings, 'full')).toBe(96);
    expect(durationFor(byId('read-aloud'), settings, 'full')).toBe(120);
  });
});

describe('repsFor', () => {
  it('uses the exercise default, then the override for that routine', () => {
    const settings = defaultSettings();
    expect(repsFor(byId('low-breathing'), settings, 'full')).toBe(8);
    settings.reps.short['low-breathing'] = 3;
    expect(repsFor(byId('low-breathing'), settings, 'short')).toBe(3);
    expect(repsFor(byId('low-breathing'), settings, 'full')).toBe(8);
  });

  it('is undefined for exercises that do not count reps', () => {
    expect(repsFor(byId('straw'), defaultSettings(), 'full')).toBeUndefined();
  });
});

describe('planRoutine', () => {
  const ids = (settings = defaultSettings()) => planRoutine(settings, 'full').map((s) => s.exercise.id);

  it('drops disabled exercises', () => {
    const settings = defaultSettings();
    settings.disabled = ['straw'];
    expect(ids(settings)).not.toContain('straw');
    expect(ids(settings)).toContain('lip-trills');
  });

  it('drops timed exercises set to zero seconds', () => {
    const settings = defaultSettings();
    settings.durations.full['lip-trills'] = 0;
    expect(ids(settings)).not.toContain('lip-trills');
    expect(ids(settings)).toContain('straw');
  });

  it('keeps rep and untimed exercises that a stale duration override set to zero', () => {
    const settings = defaultSettings();
    settings.durations.full['low-breathing'] = 0;
    settings.durations.full['read-aloud'] = 0;
    expect(ids(settings)).toEqual(expect.arrayContaining(['low-breathing', 'read-aloud']));
  });

  it('carries the rep count for a reps exercise only', () => {
    const settings = defaultSettings();
    settings.reps.full['low-breathing'] = 6;
    const steps = planRoutine(settings, 'full');
    expect(steps.find((s) => s.exercise.id === 'low-breathing')).toMatchObject({ seconds: 72, reps: 6 });
    expect(steps.find((s) => s.exercise.id === 'straw')!.reps).toBeUndefined();
  });
});

describe('totalSeconds', () => {
  it('adds the nominal time of rep and untimed exercises', () => {
    const settings = defaultSettings();
    settings.disabled = exercises.map((e) => e.id).filter((id) => id !== 'low-breathing' && id !== 'read-aloud');
    expect(totalSeconds(settings, 'full')).toBe(96 + 120);
  });
});

describe('resetSettings', () => {
  it('clears exercises, durations and reps but keeps the routine', () => {
    const settings = defaultSettings();
    settings.routine = 'short';
    settings.disabled = ['hum'];
    settings.durations.short['straw'] = 30;
    settings.reps.short['low-breathing'] = 3;
    expect(resetSettings(settings)).toEqual({ ...defaultSettings(), routine: 'short' });
  });
});
