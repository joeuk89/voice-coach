import { loadLog } from './log';
import { read, write } from './storage';

const KEY = 'onboarded';

/** True on the first ever open; an existing log counts as onboarded. */
export function needsOnboarding(): boolean {
  return read(KEY) !== true && loadLog().length === 0;
}

export function markOnboarded(): void {
  write(KEY, true);
}
