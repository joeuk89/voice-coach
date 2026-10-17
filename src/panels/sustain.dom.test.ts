// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubLocalStorage } from '../test/local-storage';
import { localDay } from '../state/log';
import { todaySustains } from '../state/sustains';
import { mountSustainPanel } from './sustain';

let container: HTMLElement;

beforeEach(() => {
  stubLocalStorage();
  vi.useFakeTimers();
  vi.stubGlobal('navigator', { vibrate: vi.fn() });
  container = document.createElement('div');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mount() {
  const onRecord = vi.fn();
  const onUndo = vi.fn();
  const panel = mountSustainPanel(container, { onRecord, onUndo });
  return { panel, onRecord, onUndo };
}

function hold(seconds: number, between?: () => void) {
  container.querySelector<HTMLElement>('#sustain-toggle')!.click();
  vi.advanceTimersByTime(seconds * 1000);
  between?.();
  container.querySelector<HTMLElement>('#sustain-toggle')!.click();
}

const undoButton = () => container.querySelector<HTMLElement>('#sustain-undo');
const summary = () => container.querySelector('#sustain-today > .muted:not(.hold-short)')?.textContent;
const chips = () => [...container.querySelectorAll('#sustain-today .chip')].map((c) => c.textContent);

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDay(d);
}

describe('mountSustainPanel', () => {
  it('shows Today, Last time and Best ever for the current step only, ignoring holds without a step', () => {
    localStorage.setItem(
      'vt.sustains',
      JSON.stringify({
        [yesterday()]: [30, { step: 0, sec: 4 }, { step: 1, sec: 6 }],
        [localDay()]: [25, { step: 1, sec: 5 }, { step: 1, sec: 7 }],
      }),
    );
    const { panel } = mount();
    panel.setStep(0);
    expect(summary()).toBe('Last time 4.0 s · Best ever 4.0 s');
    expect(chips()).toEqual([]);
    panel.setStep(1);
    expect(summary()).toBe('Best ever 7.0 s · Today');
    expect(chips()).toEqual(['7.0 s', '5.0 s']);
    panel.setStep(2);
    expect(summary()).toBe('First time: tap Start hold as the note begins.');
    expect(chips()).toEqual([]);
  });

  it('logs a hold under the current step', () => {
    const { panel } = mount();
    panel.setStep(2);
    hold(2);
    expect(todaySustains(2)).toEqual([2]);
    expect(todaySustains(0)).toEqual([]);
    expect(chips()).toEqual(['2.0 s']);
  });

  it('stays on the step when the step is reset', () => {
    const { panel } = mount();
    panel.setStep(2);
    panel.resetStep();
    hold(2);
    expect(todaySustains(2)).toEqual([2]);
  });

  it('discards a hold still running when the step changes', () => {
    const { panel, onRecord } = mount();
    hold(2, () => panel.setStep(1));
    expect(todaySustains(0)).toEqual([]);
    expect(todaySustains(1)).toEqual([]);
    expect(onRecord).not.toHaveBeenCalled();
    expect(undoButton()).toBeNull();
  });

  it('says a hold under half a second is too short and does not log it', () => {
    const { onRecord } = mount();
    hold(0.3);
    expect(todaySustains(0)).toEqual([]);
    expect(onRecord).not.toHaveBeenCalled();
    expect(container.querySelector('#sustain-today')!.textContent).toContain('Too short to count (under 0.5 s)');
    container.querySelector<HTMLElement>('#sustain-toggle')!.click();
    expect(container.querySelector('#sustain-today')!.textContent).not.toContain('Too short');
  });

  it('reports a hold started and stopped on the same step, and offers Undo', () => {
    const { onRecord } = mount();
    hold(2);
    expect(todaySustains(0)).toEqual([2]);
    expect(onRecord).toHaveBeenCalledTimes(1);
    expect(undoButton()).not.toBeNull();
  });

  it('Undo removes the hold and reports it', () => {
    const { panel, onUndo } = mount();
    panel.setStep(3);
    hold(2);
    undoButton()!.click();
    expect(todaySustains(3)).toEqual([]);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(undoButton()).toBeNull();
  });
});
