import { formatMinutes, on } from './dom';
import { totalSeconds } from '../state/settings';
import type { RoutineId, Settings } from '../types';

const ROUTINES: RoutineId[] = ['short', 'full'];

/** Short / Full toggle buttons; the pressed one is the current routine. Minutes are for the date's plan, today by default. */
export function routineToggle(settings: Settings, label: string, date = new Date()): string {
  const options = ROUTINES.map((r) => {
    const pressed = settings.routine === r;
    return `<button type="button" class="seg" data-routine="${r}" data-focus="routine-${r}" aria-pressed="${pressed}">
      ${r === 'short' ? 'Short' : 'Full'} <small>${formatMinutes(totalSeconds(settings, r, date))}</small></button>`;
  });
  return `<div class="segmented" role="group" aria-label="${label}">${options.join('')}</div>`;
}

/** Wires the toggle's buttons: a tap sets `settings.routine`, then calls `onChange`. */
export function bindRoutineToggle(root: ParentNode, settings: Settings, onChange: () => void): void {
  on(root, '[data-routine]', 'click', (_ev, el) => {
    const routine = ROUTINES.find((r) => r === el.dataset['routine']);
    if (!routine) return;
    settings.routine = routine;
    onChange();
  });
}
