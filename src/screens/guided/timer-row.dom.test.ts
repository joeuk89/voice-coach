// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { playCue } from '../../lib/audio';
import { buzz } from '../../lib/haptics';
import type { PlannedSubStep } from '../../state/plan';
import { mountPaced, type RowHooks } from './timer-row';

vi.mock('../../lib/audio', () => ({ playCue: vi.fn() }));
vi.mock('../../lib/haptics', () => ({ buzz: vi.fn() }));

const planned = (reps: number): PlannedSubStep => ({
  subStep: { text: '', pace: { inSec: 4, outSec: 8 } },
  mode: 'paced',
  seconds: 0,
  reps,
});

const makeHooks = () => ({ setDone: vi.fn<RowHooks['setDone']>(), started: vi.fn<RowHooks['started']>() });
const makePicture = () => ({ rest: vi.fn<() => void>(), restart: vi.fn<(fromMs?: number) => void>(), pause: vi.fn<() => void>() });

let row: HTMLElement;
let hooks: ReturnType<typeof makeHooks>;
let picture: ReturnType<typeof makePicture>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'performance'] });
  vi.mocked(playCue).mockClear();
  vi.mocked(buzz).mockClear();
  row = document.createElement('div');
  document.body.append(row);
  hooks = makeHooks();
  picture = makePicture();
});

afterEach(() => {
  row.remove();
  vi.useRealTimers();
});

const text = (selector: string) => row.querySelector(selector)!.textContent!.replace(/\s+/g, ' ').trim();
const readout = () => [text('#pace-count'), text('#pace-phase')];
const toggle = () => row.querySelector<HTMLButtonElement>('#timer-toggle')!;
const reset = () => row.querySelector<HTMLButtonElement>('#timer-reset')!;
const seconds = (sec: number) => vi.advanceTimersByTime(sec * 1000);

describe('mountPaced', () => {
  it('waits on Start with the picture at rest', () => {
    mountPaced(row, planned(8), hooks, picture);
    expect(readout()).toEqual(['Breath 1 of 8', '']);
    expect(toggle().textContent).toBe('Start');
    expect(reset().disabled).toBe(true);
    expect(picture.rest).toHaveBeenCalled();
    expect(hooks.setDone).toHaveBeenLastCalledWith(false, false);
  });

  it('counts a 3-second lead-in, then paces each breath in for 4 and out for 8', () => {
    mountPaced(row, planned(8), hooks, picture);
    toggle().click();
    expect(hooks.started).toHaveBeenCalled();
    expect(readout()).toEqual(['Ready · 3', '']);
    seconds(1);
    expect(readout()).toEqual(['Ready · 2', '']);
    seconds(1);
    expect(readout()).toEqual(['Ready · 1', '']);
    expect(picture.restart).not.toHaveBeenCalled();
    expect(buzz).not.toHaveBeenCalled();

    seconds(1);
    expect(readout()).toEqual(['Breath 1 of 8', 'In · 4']);
    expect(picture.restart).toHaveBeenLastCalledWith(0);
    expect(buzz).toHaveBeenLastCalledWith(40);
    seconds(1);
    expect(readout()).toEqual(['Breath 1 of 8', 'In · 3']);
    seconds(3);
    expect(readout()).toEqual(['Breath 1 of 8', 'Out · 8']);
    expect(buzz).toHaveBeenCalledTimes(2);
    seconds(8);
    expect(readout()).toEqual(['Breath 2 of 8', 'In · 4']);
    expect(buzz).toHaveBeenCalledTimes(3);
  });

  it('chimes, buzzes and finishes the step after the last exhale', () => {
    mountPaced(row, planned(5), hooks, picture);
    toggle().click();
    seconds(3 + 12 * 5 - 0.2);
    expect(readout()).toEqual(['Breath 5 of 5', 'Out · 1']);
    expect(playCue).not.toHaveBeenCalled();
    picture.rest.mockClear();
    seconds(0.2);
    expect(playCue).toHaveBeenCalledTimes(1);
    expect(buzz).toHaveBeenLastCalledWith();
    expect(hooks.setDone).toHaveBeenLastCalledWith(true, true);
    expect(readout()).toEqual(['Breath 5 of 5', '']);
    expect(row.querySelector('#pace-count .done-mark')).not.toBeNull();
    expect(toggle().hidden).toBe(true);
    expect(reset().disabled).toBe(false);
    expect(picture.rest).toHaveBeenCalledTimes(1);
  });

  it('pauses mid-breath and replays that breath after a new lead-in', () => {
    mountPaced(row, planned(8), hooks, picture);
    toggle().click();
    seconds(3 + 12 * 2 + 6);
    expect(readout()).toEqual(['Breath 3 of 8', 'Out · 6']);
    toggle().click();
    expect(picture.pause).toHaveBeenCalled();
    expect(readout()).toEqual(['Breath 3 of 8', 'Paused']);
    expect(toggle().textContent).toBe('Resume');
    seconds(30);
    expect(readout()).toEqual(['Breath 3 of 8', 'Paused']);

    toggle().click();
    expect(readout()).toEqual(['Ready · 3', '']);
    expect(toggle().textContent).toBe('Pause');
    seconds(3);
    expect(readout()).toEqual(['Breath 3 of 8', 'In · 4']);
  });

  it('keeps the breath when paused during the lead-in', () => {
    mountPaced(row, planned(8), hooks, picture);
    toggle().click();
    seconds(3 + 12 + 1);
    toggle().click();
    toggle().click();
    seconds(1);
    toggle().click();
    expect(readout()).toEqual(['Breath 2 of 8', 'Paused']);
  });

  it('resets to Start from breath 1 with the picture at rest', () => {
    mountPaced(row, planned(8), hooks, picture);
    toggle().click();
    seconds(3 + 12 * 3);
    picture.rest.mockClear();
    reset().click();
    expect(readout()).toEqual(['Breath 1 of 8', '']);
    expect(toggle().textContent).toBe('Start');
    expect(reset().disabled).toBe(true);
    expect(picture.rest).toHaveBeenCalled();
    seconds(20);
    expect(readout()).toEqual(['Breath 1 of 8', '']);
    toggle().click();
    seconds(3);
    expect(readout()).toEqual(['Breath 1 of 8', 'In · 4']);
  });

  it('stops ticking when the step is left', () => {
    const stepRow = mountPaced(row, planned(8), hooks, picture);
    toggle().click();
    stepRow.stop();
    seconds(200);
    expect(playCue).not.toHaveBeenCalled();
  });
});
