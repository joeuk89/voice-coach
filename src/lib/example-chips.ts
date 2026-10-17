import { esc } from './dom';

/** A sub-step's example words as a row of chips, or nothing when it has none. */
export function exampleChips(examples: readonly string[] | undefined): string {
  if (!examples?.length) return '';
  const chips = examples.map((e) => `<span class="chip">${esc(e)}</span>`).join(' ');
  return `<p class="examples"><span class="visually-hidden">Examples: </span>${chips}</p>`;
}
