// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { stubLocalStorage } from '../test/local-storage';
import type { Settings } from '../types';
import { renderSettings } from './settings';

let storage: Storage;
let root: HTMLElement;

beforeEach(() => {
  storage = stubLocalStorage();
  root = document.createElement('div');
  document.body.append(root);
});

afterEach(() => root.remove());

function open(save: object) {
  storage.setItem('vt.settings', JSON.stringify(save));
  renderSettings(root);
}

const chips = (id: string) => [...root.querySelectorAll<HTMLButtonElement>(`.day-chip[data-ex="${id}"]`)];
const chip = (id: string, label: string) => root.querySelector<HTMLButtonElement>(`.day-chip[data-ex="${id}"][aria-label^="${label},"]`)!;
const pressed = (id: string) => chips(id).filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.textContent);
const stored = () => JSON.parse(storage.getItem('vt.settings')!) as Settings;

describe('Settings day chips', () => {
  it('shows seven named toggles, Monday first, with the scheduled days pressed', () => {
    open({ routine: 'short', days: { short: { vfe: [1, 3, 5] }, full: {} } });
    expect(chips('vfe').map((c) => c.textContent)).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    expect(chips('vfe').map((c) => c.getAttribute('aria-label'))[0]).toBe('Monday, Vocal function exercises');
    expect(chip('vfe', 'Sunday').getAttribute('aria-label')).toBe('Sunday, Vocal function exercises');
    expect(pressed('vfe')).toEqual(['M', 'W', 'F']);
    expect(pressed('hum')).toHaveLength(7);
  });

  it('toggles a day, saves it and keeps focus on the same toggle', () => {
    open({ routine: 'short', days: { short: { vfe: [1, 3, 5] }, full: {} } });
    const tuesday = chip('vfe', 'Tuesday');
    tuesday.focus();
    tuesday.click();
    expect(stored().days.short['vfe']).toEqual([1, 2, 3, 5]);
    expect(chip('vfe', 'Tuesday').getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(chip('vfe', 'Tuesday'));
    expect(document.activeElement).not.toBe(tuesday);
  });

  it('changes the routine on screen only', () => {
    open({ routine: 'full', days: { short: { vfe: [1, 3, 5] }, full: {} } });
    chip('vfe', 'Monday').click();
    expect(stored().days).toEqual({ short: { vfe: [1, 3, 5] }, full: { vfe: [0, 2, 3, 4, 5, 6] } });
  });

  it('disables the last day left on, and enables it again once another day is on', () => {
    open({ routine: 'short', days: { short: { vfe: [1, 3] }, full: {} } });
    expect(chips('vfe').some((c) => c.disabled)).toBe(false);
    const wednesday = chip('vfe', 'Wednesday');
    wednesday.focus();
    wednesday.click();
    expect(pressed('vfe')).toEqual(['M']);
    expect(chip('vfe', 'Monday').disabled).toBe(true);
    expect(chips('vfe').filter((c) => c.disabled)).toHaveLength(1);
    expect(document.activeElement).toBe(chip('vfe', 'Wednesday'));

    chip('vfe', 'Monday').click();
    expect(stored().days.short['vfe']).toEqual([1]);

    chip('vfe', 'Friday').click();
    expect(chip('vfe', 'Monday').disabled).toBe(false);
    expect(stored().days.short['vfe']).toEqual([1, 5]);
  });

  it('saves no entry once every day is on', () => {
    open({ routine: 'short', days: { short: { hum: [0, 1, 2, 3, 4, 5] }, full: {} } });
    chip('hum', 'Saturday').click();
    expect(stored().days.short).toEqual({});
  });

  it('shows no toggles on a row that is switched off', () => {
    open({ routine: 'short', disabled: { short: ['vfe'], full: [] }, days: { short: {}, full: {} } });
    expect(chips('vfe')).toHaveLength(0);
    expect(chips('hum')).toHaveLength(7);
  });

  it('mentions days in the intro and the reset dialog', () => {
    open({ routine: 'short', days: { short: {}, full: {} } });
    expect(root.querySelector('.settings-intro')!.textContent).toMatch(/^Times, counts and days for the Short routine\./);
    expect(root.querySelector('#reset-confirm p')!.textContent).toBe('Every exercise goes back to its default routines, days, time and count.');
  });
});
