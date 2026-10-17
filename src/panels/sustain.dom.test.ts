// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stubLocalStorage } from '../test/local-storage';
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

describe('mountSustainPanel', () => {
  it('discards a hold still running when the step changes', () => {
    const { panel, onRecord } = mount();
    hold(2, () => panel.resetStep());
    expect(todaySustains()).toEqual([]);
    expect(onRecord).not.toHaveBeenCalled();
    expect(undoButton()).toBeNull();
  });

  it('says a hold under half a second is too short and does not log it', () => {
    const { onRecord } = mount();
    hold(0.3);
    expect(todaySustains()).toEqual([]);
    expect(onRecord).not.toHaveBeenCalled();
    expect(container.querySelector('#sustain-today')!.textContent).toContain('Too short to count (under 0.5 s)');
    container.querySelector<HTMLElement>('#sustain-toggle')!.click();
    expect(container.querySelector('#sustain-today')!.textContent).not.toContain('Too short');
  });

  it('reports a hold started and stopped on the same step, and offers Undo', () => {
    const { onRecord } = mount();
    hold(2);
    expect(todaySustains()).toEqual([2]);
    expect(onRecord).toHaveBeenCalledTimes(1);
    expect(undoButton()).not.toBeNull();
  });

  it('Undo removes the hold and reports it', () => {
    const { onUndo } = mount();
    hold(2);
    undoButton()!.click();
    expect(todaySustains()).toEqual([]);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(undoButton()).toBeNull();
  });
});
