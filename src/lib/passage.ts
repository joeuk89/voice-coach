import { esc } from './dom';

/** A passage as HTML: *marked* words become bold so the eye lands on the pitch moves. */
export function renderPassage(text: string): string {
  return esc(text).replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
}
