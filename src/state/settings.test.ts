import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exercises } from '../exercises';
import type { Settings } from '../types';
import { stubLocalStorage } from '../test/local-storage';
import { defaultSettings, durationFor, isOn, loadSettings, planRoutine, repsFor, resetSettings, totalSeconds } from './settings';

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
      JSON.stringify({
        routine: 3,
        disabled: { short: ['hum', 4], full: 'straw' },
        durations: { short: { hum: 'x', straw: 30 }, full: null },
      }),
    );
    expect(settings).toEqual({
      routine: 'full',
      disabled: { short: ['hum'], full: [] },
      durations: { short: { straw: 30 }, full: {} },
      reps: { short: {}, full: {} },
    });
  });

  it('keeps saved switches per routine', () => {
    expect(saved('{"disabled":{"short":["straw"],"full":["vfe","hum"]}}').disabled).toEqual({
      short: ['straw'],
      full: ['vfe', 'hum'],
    });
  });

  it('keeps an empty saved list, so an exercise that is off by default can be on', () => {
    expect(saved('{"disabled":{"short":[],"full":[]}}').disabled).toEqual({ short: [], full: [] });
  });

  it('keeps saved rep counts per routine', () => {
    expect(saved('{"reps":{"short":{"low-breathing":3},"full":{"low-breathing":10}}}').reps).toEqual({
      short: { 'low-breathing': 3 },
      full: { 'low-breathing': 10 },
    });
  });

  it('drops rep counts that are not finite numbers or are below 1', () => {
    const settings = saved(
      JSON.stringify({ reps: { short: { hum: 'x', straw: 0, sirens: -2, vfe: 0.5, 'low-breathing': 1 }, full: [4] } }),
    );
    expect(settings.reps).toEqual({ short: { 'low-breathing': 1 }, full: {} });
    expect(saved('{"reps":7}').reps).toEqual({ short: {}, full: {} });
  });

  it('drops ids of exercises that no longer exist, in switches, times and counts', () => {
    const settings = saved(
      JSON.stringify({
        disabled: { short: ['roger-love', 'hum'], full: ['roger-love'] },
        durations: { short: { 'roger-love': 836 }, full: { hum: 90 } },
        reps: { short: { 'roger-love': 3 }, full: {} },
      }),
    );
    expect(settings.disabled).toEqual({ short: ['hum'], full: [] });
    expect(settings.durations).toEqual({ short: {}, full: { hum: 90 } });
    expect(settings.reps).toEqual({ short: {}, full: {} });
  });

  it('writes a save back once loading has changed it, and leaves a clean save alone', () => {
    saved(JSON.stringify({ disabled: { short: ['roger-love'], full: [] } }));
    const stored = JSON.parse(storage.getItem('vt.settings')!) as Settings;
    expect(stored.disabled).toEqual({ short: [], full: [] });
    expect(stored.durations).toEqual({ short: {}, full: {} });

    const clean = defaultSettings();
    storage.setItem('vt.settings', JSON.stringify(clean));
    const setItem = vi.spyOn(storage, 'setItem');
    expect(loadSettings()).toEqual(clean);
    expect(setItem).not.toHaveBeenCalled();

    storage.clear();
    expect(loadSettings()).toEqual(clean);
    expect(storage.getItem('vt.settings')).toBeNull();
  });

  it('ignores a disabled value that is neither a list nor a per-routine record', () => {
    expect(saved('{"disabled":"hum"}').disabled).toEqual(defaultSettings().disabled);
  });

  it('raises saved times below 30 seconds to 30', () => {
    expect(saved('{"durations":{"short":{"straw":10,"hum":29.5},"full":{"sirens":30}}}').durations).toEqual({
      short: { straw: 30, hum: 30 },
      full: { sirens: 30 },
    });
  });

  it('drops negative saved times', () => {
    expect(saved('{"durations":{"short":{"straw":-30},"full":{}}}').durations.short).toEqual({});
  });
});

describe('loadSettings migration from older saves', () => {
  it('turns an id in the old flat list off in both routines, on top of the defaults', () => {
    const { disabled } = saved('{"disabled":["hum"]}');
    expect(disabled.short).toEqual([...defaultSettings().disabled.short, 'hum']);
    expect(disabled.full).toEqual(['hum']);
  });

  it('keeps a default-off exercise on where the old save gave it a time', () => {
    const settings = saved(JSON.stringify({ routine: 'short', disabled: [], durations: { short: { vfe: 60 }, full: {} } }));
    expect(isOn(byId('vfe'), settings, 'short')).toBe(true);
    expect(planRoutine(settings, 'short').find((s) => s.exercise.id === 'vfe')?.seconds).toBe(60);
    expect(isOn(byId('read-aloud'), settings, 'short')).toBe(false);
  });

  it('still turns a default-off exercise off when the old flat list has it, whatever its time', () => {
    const settings = saved(JSON.stringify({ disabled: ['vfe'], durations: { short: { vfe: 60 }, full: {} } }));
    expect(isOn(byId('vfe'), settings, 'short')).toBe(false);
    expect(isOn(byId('vfe'), settings, 'full')).toBe(false);
  });

  it('does not list an id twice when the old flat list repeats a default', () => {
    expect(saved('{"disabled":["vfe","vfe"]}').disabled.short).toEqual(defaultSettings().disabled.short);
  });

  it('turns a timed exercise with a saved 0 off in that routine only and drops the 0', () => {
    const settings = saved('{"durations":{"short":{"sirens":0,"straw":60},"full":{}}}');
    expect(settings.disabled.short).toContain('sirens');
    expect(settings.disabled.full).not.toContain('sirens');
    expect(settings.durations).toEqual({ short: { straw: 60 }, full: {} });
  });

  it('drops a stale 0 on a counted or untimed exercise without turning it off, as the old app ignored it', () => {
    const settings = saved('{"durations":{"short":{},"full":{"low-breathing":0,"read-aloud":0}}}');
    expect(settings.disabled.full).toEqual([]);
    expect(settings.durations.full).toEqual({});
  });

  it('migrates the handoff example: hum off in both, sirens off in Short only', () => {
    const settings = saved(JSON.stringify({ disabled: ['hum'], durations: { short: { sirens: 0 }, full: {} } }));
    expect(isOn(byId('hum'), settings, 'short')).toBe(false);
    expect(isOn(byId('hum'), settings, 'full')).toBe(false);
    expect(isOn(byId('sirens'), settings, 'short')).toBe(false);
    expect(isOn(byId('sirens'), settings, 'full')).toBe(true);
    expect(settings.durations).toEqual({ short: {}, full: {} });
  });
});

describe('defaultSettings', () => {
  it('turns the vocal function exercises, the read-aloud and the cool-down off in Short only', () => {
    const settings = defaultSettings();
    const on = (routine: 'short' | 'full') => exercises.filter((e) => isOn(e, settings, routine)).map((e) => e.id);
    expect(on('short')).toEqual(['low-breathing', 'articulation', 'straw', 'lip-trills', 'sirens', 'hum', 'dynamics']);
    expect(on('full')).toEqual(exercises.map((e) => e.id));
  });
});

describe('exercise data', () => {
  it('gives every exercise a time of at least 30 seconds in both routines', () => {
    for (const e of exercises) {
      for (const routine of ['short', 'full'] as const) {
        expect(durationFor(e, defaultSettings(), routine), `${e.id} ${routine}`).toBeGreaterThanOrEqual(30);
      }
    }
  });

  it('gives the default-off exercises the same time in Short as in Full', () => {
    for (const id of ['vfe', 'read-aloud']) {
      expect(durationFor(byId(id), defaultSettings(), 'short')).toBe(durationFor(byId(id), defaultSettings(), 'full'));
    }
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
    settings.durations.full['read-aloud'] = 300;
    expect(durationFor(byId('low-breathing'), settings, 'full')).toBe(96);
    expect(durationFor(byId('read-aloud'), settings, 'full')).toBe(180);
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

  it('drops exercises switched off in that routine only', () => {
    const settings = defaultSettings();
    settings.disabled.full = ['straw'];
    expect(ids(settings)).not.toContain('straw');
    expect(ids(settings)).toContain('lip-trills');
    expect(planRoutine(settings, 'short').map((s) => s.exercise.id)).toContain('straw');
  });

  it('runs an exercise that is off by default in Short once it is switched on there', () => {
    const settings = defaultSettings();
    settings.disabled.short = settings.disabled.short.filter((id) => id !== 'vfe');
    expect(planRoutine(settings, 'short').find((s) => s.exercise.id === 'vfe')?.seconds).toBe(240);
  });

  it('is empty when every exercise is off in that routine', () => {
    const settings = defaultSettings();
    settings.disabled.short = exercises.map((e) => e.id);
    expect(planRoutine(settings, 'short')).toEqual([]);
    expect(planRoutine(settings, 'full')).toHaveLength(exercises.length);
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
    settings.disabled.full = exercises.map((e) => e.id).filter((id) => id !== 'low-breathing' && id !== 'read-aloud');
    expect(totalSeconds(settings, 'full')).toBe(96 + 180);
  });
});

describe('resetSettings', () => {
  it('clears exercises, durations and reps but keeps the routine', () => {
    const settings = defaultSettings();
    settings.routine = 'short';
    settings.disabled.short = ['hum'];
    settings.disabled.full = ['vfe'];
    settings.durations.short['straw'] = 30;
    settings.reps.short['low-breathing'] = 3;
    expect(resetSettings(settings)).toEqual({ ...defaultSettings(), routine: 'short' });
  });
});
