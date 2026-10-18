import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exercises } from '../exercises';
import type { Settings } from '../types';
import { stubLocalStorage } from '../test/local-storage';
import {
  daysFor,
  defaultSettings,
  durationFor,
  isOn,
  loadSettings,
  planRoutine,
  repsFor,
  resetSettings,
  restingOn,
  runsOn,
  toggleDay,
  totalSeconds,
} from './settings';

let storage: Storage;
const byId = (id: string) => exercises.find((e) => e.id === id)!;
const SUNDAY = new Date(2026, 9, 18);
const MONDAY = new Date(2026, 9, 19);
const TUESDAY = new Date(2026, 9, 20);

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
      days: defaultSettings().days,
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
  // Nothing starts switched off any more, so the flat list is the whole off list in both routines.
  it('turns an id in the old flat list off in both routines', () => {
    expect(saved('{"disabled":["hum"]}').disabled).toEqual({ short: ['hum'], full: ['hum'] });
  });

  // The flat list predates the schedule too: the old default-off exercises now run in Short on their days.
  it('turns the old default-off exercises on in Short, where the schedule now decides', () => {
    const settings = saved(JSON.stringify({ routine: 'short', disabled: [], durations: { short: { vfe: 60 }, full: {} } }));
    expect(isOn(byId('vfe'), settings, 'short')).toBe(true);
    expect(isOn(byId('read-aloud'), settings, 'short')).toBe(true);
    expect(planRoutine(settings, 'short', MONDAY).find((s) => s.exercise.id === 'vfe')?.seconds).toBe(60);
    expect(settings.days).toEqual(defaultSettings().days);
  });

  it('still turns a default-off exercise off when the old flat list has it, whatever its time', () => {
    const settings = saved(JSON.stringify({ disabled: ['vfe'], durations: { short: { vfe: 60 }, full: {} } }));
    expect(isOn(byId('vfe'), settings, 'short')).toBe(false);
    expect(isOn(byId('vfe'), settings, 'full')).toBe(false);
  });

  it('does not list an id twice when the old flat list repeats it', () => {
    expect(saved('{"disabled":["vfe","vfe"]}').disabled).toEqual({ short: ['vfe'], full: ['vfe'] });
  });

  it('keeps the two routines\' lists apart after a flat list', () => {
    const settings = saved('{"disabled":["hum"],"durations":{"short":{"sirens":0},"full":{}}}');
    expect(settings.disabled).toEqual({ short: ['hum', 'sirens'], full: ['hum'] });
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

describe('loadSettings migration from saves before the schedule', () => {
  const preSchedule = {
    routine: 'short',
    disabled: { short: ['vfe', 'read-aloud', 'hum', 'cool-down'], full: ['vfe', 'straw'] },
    durations: { short: { straw: 60 }, full: { vfe: 300 } },
    reps: { short: { 'low-breathing': 3 }, full: {} },
  };

  it('takes exactly the vocal function exercises and the read-aloud out of the Short off list', () => {
    const settings = saved(JSON.stringify(preSchedule));
    expect(settings.disabled).toEqual({ short: ['hum', 'cool-down'], full: ['vfe', 'straw'] });
  });

  it('keeps everything else in the save and seeds the default schedule', () => {
    const settings = saved(JSON.stringify(preSchedule));
    expect(settings).toMatchObject({ routine: 'short', durations: preSchedule.durations, reps: preSchedule.reps });
    expect(settings.days).toEqual(defaultSettings().days);
  });

  it('writes the migrated save back, so it happens once', () => {
    saved(JSON.stringify(preSchedule));
    const stored = JSON.parse(storage.getItem('vt.settings')!) as Settings;
    expect(stored.disabled.short).toEqual(['hum', 'cool-down']);
    expect(stored.days).toEqual(defaultSettings().days);
  });

  it('leaves the Short off list alone once the save has days', () => {
    const settings = saved(JSON.stringify({ ...preSchedule, days: { short: {}, full: {} } }));
    expect(settings.disabled.short).toEqual(['vfe', 'read-aloud', 'hum', 'cool-down']);
  });
});

describe('loadSettings days', () => {
  it('keeps saved days per routine', () => {
    const settings = saved('{"days":{"short":{"hum":[1,2]},"full":{"vfe":[0,6]}}}');
    expect(settings.days).toEqual({ short: { hum: [1, 2] }, full: { vfe: [0, 6] } });
  });

  it('keeps integers 0 to 6 only, without repeats, in order', () => {
    const settings = saved('{"days":{"short":{"hum":[5,1,"3",7,-1,2.5,1,null,3]},"full":{}}}');
    expect(settings.days.short).toEqual({ hum: [1, 3, 5] });
  });

  it('gives an exercise its default back when its list is empty or invalid', () => {
    const settings = saved('{"days":{"short":{"vfe":[],"read-aloud":"tue","hum":[9]},"full":{"straw":{}}}}');
    expect(settings.days.short).toEqual({ vfe: [1, 3, 5], 'read-aloud': [2, 4, 6] });
    expect(settings.days.full).toEqual({});
  });

  it('drops a list of all seven days, as no entry means every day', () => {
    expect(saved('{"days":{"short":{"vfe":[6,5,4,3,2,1,0]},"full":{}}}').days.short).toEqual({});
  });

  it('drops ids of exercises that do not exist', () => {
    expect(saved('{"days":{"short":{"roger-love":[1]},"full":{"__proto__":[1]}}}').days).toEqual({ short: {}, full: {} });
  });

  it('falls back to the default schedule for a routine that is missing or malformed', () => {
    const settings = saved('{"days":{"short":[1,2],"full":{"hum":[3]}}}');
    expect(settings.days).toEqual({ short: defaultSettings().days.short, full: { hum: [3] } });
    expect(saved('{"days":"often","disabled":{"short":["vfe"],"full":[]}}')).toMatchObject({
      days: defaultSettings().days,
      disabled: { short: ['vfe'], full: [] },
    });
  });
});

describe('defaultSettings', () => {
  it('switches nothing off', () => {
    const settings = defaultSettings();
    expect(settings.disabled).toEqual({ short: [], full: [] });
    expect(exercises.every((e) => isOn(e, settings, 'short') && isOn(e, settings, 'full'))).toBe(true);
  });

  it('seeds the schedule from the exercises: three in Short on set days, Full every day', () => {
    expect(defaultSettings().days).toEqual({
      short: { vfe: [1, 3, 5], 'read-aloud': [2, 4, 6], 'cool-down': [1, 3, 5] },
      full: {},
    });
  });

  it('does not share the exercise data, so changing the days leaves the defaults alone', () => {
    const settings = defaultSettings();
    settings.days.short['vfe']!.push(0);
    expect(defaultSettings().days.short['vfe']).toEqual([1, 3, 5]);
  });
});

describe('days', () => {
  it('reads an exercise without an entry as every day', () => {
    expect(daysFor(byId('hum'), defaultSettings(), 'short')).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(daysFor(byId('vfe'), defaultSettings(), 'short')).toEqual([1, 3, 5]);
    expect(daysFor(byId('vfe'), defaultSettings(), 'full')).toHaveLength(7);
  });

  it('runs an exercise when its switch is on and the day is scheduled', () => {
    const settings = defaultSettings();
    expect(runsOn(byId('vfe'), settings, 'short', 1)).toBe(true);
    expect(runsOn(byId('vfe'), settings, 'short', 2)).toBe(false);
    settings.disabled.short = ['vfe'];
    expect(runsOn(byId('vfe'), settings, 'short', 1)).toBe(false);
    expect(isOn(byId('vfe'), defaultSettings(), 'short')).toBe(true);
  });

  it('toggles a day in one routine, sorted, and never turns off the last day', () => {
    const settings = defaultSettings();
    toggleDay(byId('vfe'), settings, 'short', 0);
    expect(settings.days.short['vfe']).toEqual([0, 1, 3, 5]);
    toggleDay(byId('hum'), settings, 'full', 3);
    expect(settings.days.full['hum']).toEqual([0, 1, 2, 4, 5, 6]);
    for (const day of [0, 1, 3] as const) toggleDay(byId('vfe'), settings, 'short', day);
    expect(settings.days.short['vfe']).toEqual([5]);
    toggleDay(byId('vfe'), settings, 'short', 5);
    expect(settings.days.short['vfe']).toEqual([5]);
  });

  it('drops the entry once every day is on', () => {
    const settings = defaultSettings();
    for (const day of [0, 2, 4, 6] as const) toggleDay(byId('vfe'), settings, 'short', day);
    expect(settings.days.short).not.toHaveProperty('vfe');
    expect(daysFor(byId('vfe'), settings, 'short')).toHaveLength(7);
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

  it('gives the scheduled Short exercises the same time in Short as in Full', () => {
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

  it('runs each Short exercise on its days only', () => {
    const short = (date: Date) => planRoutine(defaultSettings(), 'short', date).map((s) => s.exercise.id);
    const everyDay = ['low-breathing', 'articulation', 'straw', 'lip-trills', 'sirens', 'hum', 'dynamics'];
    expect(short(MONDAY)).toEqual([...everyDay, 'vfe', 'cool-down']);
    expect(short(TUESDAY)).toEqual([...everyDay, 'read-aloud']);
    expect(short(SUNDAY)).toEqual(everyDay);
    expect(planRoutine(defaultSettings(), 'short', MONDAY).find((s) => s.exercise.id === 'vfe')?.seconds).toBe(240);
  });

  it('runs everything every day in Full by default', () => {
    for (const date of [SUNDAY, MONDAY, TUESDAY]) {
      expect(planRoutine(defaultSettings(), 'full', date)).toHaveLength(exercises.length);
    }
  });

  it('follows the switch as well as the days', () => {
    const settings = defaultSettings();
    settings.disabled.short = ['vfe'];
    expect(planRoutine(settings, 'short', MONDAY).map((s) => s.exercise.id)).not.toContain('vfe');
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

describe('restingOn', () => {
  it('lists the exercises switched on but not scheduled that day', () => {
    const ids = (date: Date, settings = defaultSettings()) => restingOn(settings, 'short', date).map((e) => e.id);
    expect(ids(MONDAY)).toEqual(['read-aloud']);
    expect(ids(SUNDAY)).toEqual(['vfe', 'read-aloud', 'cool-down']);
    expect(restingOn(defaultSettings(), 'full', SUNDAY)).toEqual([]);
    const settings = defaultSettings();
    settings.disabled.short = ['read-aloud'];
    expect(ids(MONDAY, settings)).toEqual([]);
  });
});

describe('totalSeconds', () => {
  it('adds up the day\'s plan', () => {
    const settings = defaultSettings();
    expect(totalSeconds(settings, 'short', SUNDAY)).toBe(480);
    expect(totalSeconds(settings, 'short', MONDAY)).toBe(480 + 240 + 30);
    expect(totalSeconds(settings, 'short', TUESDAY)).toBe(480 + 180);
    expect(totalSeconds(settings, 'full', SUNDAY)).toBe(totalSeconds(settings, 'full', MONDAY));
  });

  it('adds the nominal time of rep and untimed exercises', () => {
    const settings = defaultSettings();
    settings.disabled.full = exercises.map((e) => e.id).filter((id) => id !== 'low-breathing' && id !== 'read-aloud');
    expect(totalSeconds(settings, 'full')).toBe(96 + 180);
  });
});

describe('resetSettings', () => {
  it('clears exercises, durations, reps and days but keeps the routine', () => {
    const settings = defaultSettings();
    settings.routine = 'short';
    settings.disabled.short = ['hum'];
    settings.disabled.full = ['vfe'];
    settings.durations.short['straw'] = 30;
    settings.reps.short['low-breathing'] = 3;
    toggleDay(byId('vfe'), settings, 'short', 0);
    toggleDay(byId('hum'), settings, 'full', 2);
    delete settings.days.short['cool-down'];
    expect(resetSettings(settings)).toEqual({ ...defaultSettings(), routine: 'short' });
    expect(resetSettings(settings).days.short['cool-down']).toEqual([1, 3, 5]);
  });
});
