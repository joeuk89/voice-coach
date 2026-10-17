import { formatMinutes } from './dom';
import { totalSeconds } from '../state/settings';
import type { RoutineId, Settings } from '../types';

/** Short / Full radio group; the chosen option carries `data-routine`. */
export function routineToggle(settings: Settings, label: string): string {
  const options = (['short', 'full'] as RoutineId[]).map((r) => {
    const on = settings.routine === r;
    return `<button class="seg ${on ? 'on' : ''}" data-routine="${r}" role="radio" aria-checked="${on}">
      ${r === 'short' ? 'Short' : 'Full'} <small>${formatMinutes(totalSeconds(settings, r))}</small></button>`;
  });
  return `<div class="segmented" role="radiogroup" aria-label="${label}">${options.join('')}</div>`;
}
