import { describe, expect, it } from 'vitest';
import { exercises } from '../exercises';
import { animationFor } from '.';

function openingWords(text: string, count = 3): string {
  return text.toLowerCase().split(' ').slice(0, count).join(' ');
}

describe('gallery captions', () => {
  const windowed: string[] = [];
  const unwindowed: string[] = [];

  for (const exercise of exercises) {
    const def = animationFor(exercise.animation);
    if (!def) continue;
    def.phases.forEach((phase, i) => {
      const from = i === 0 ? 0 : def.phases[i - 1]!.until;
      const sub = exercise.subSteps.find((s) => s.window?.[0] === from && s.window[1] === phase.until);
      const label = `${exercise.id}: ${phase.caption}`;
      if (sub) {
        windowed.push(label);
        it(`opens the sub-step text (${label})`, () => expect(sub.text.startsWith(phase.caption)).toBe(true));
      } else {
        unwindowed.push(label);
        const opening = openingWords(phase.caption);
        it(`starts with words from a sub-step (${label})`, () => {
          expect(exercise.subSteps.some((s) => s.text.toLowerCase().includes(opening))).toBe(true);
        });
      }
    });
  }

  it('covers every phase', () => {
    expect(windowed).toHaveLength(22);
    expect(unwindowed).toHaveLength(2);
  });
});
