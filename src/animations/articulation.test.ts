import { describe, expect, it } from 'vitest';
import { exercises } from '../exercises';
import { articulation, twisterParts } from './articulation';

describe('articulation twister', () => {
  const step4 = exercises.find((e) => e.id === 'articulation')?.subSteps[3];

  it('lights the parts of a twister from the step 4 chips', () => {
    const line = twisterParts.join('').replace(/[“”]/g, '');
    expect(step4?.examples).toContain(line);
  });

  it('draws one lit part per syllable, with the curly quotes on the ends', () => {
    expect(twisterParts).toHaveLength(7);
    expect(twisterParts[0]!.startsWith('“')).toBe(true);
    expect(twisterParts[twisterParts.length - 1]!.endsWith('”')).toBe(true);
  });

  it('puts the twister in the last window', () => {
    expect(step4?.window).toEqual([articulation.phases[2]!.until, articulation.phases[3]!.until]);
  });
});
