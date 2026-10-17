import { describe, expect, it } from 'vitest';
import { exercises } from '../../exercises';
import { planSubSteps } from '../../state/plan';
import { isLibraryHash, libraryIdFromHash, routineDurations, shareLabel } from './helpers';

const byId = (id: string) => exercises.find((e) => e.id === id)!;

describe('library routes', () => {
  it('matches the list and detail hashes only', () => {
    expect(isLibraryHash('#/library')).toBe(true);
    expect(isLibraryHash('#/library/straw')).toBe(true);
    expect(isLibraryHash('#/libraryx')).toBe(false);
    expect(isLibraryHash('#/')).toBe(false);
  });

  it('reads the exercise id, if any', () => {
    expect(libraryIdFromHash('#/library')).toBeUndefined();
    expect(libraryIdFromHash('#/library/')).toBeUndefined();
    expect(libraryIdFromHash('#/library/straw')).toBe('straw');
  });
});

describe('routineDurations', () => {
  it('shows both routines when the exercise is in both', () => {
    expect(routineDurations(60, 120)).toBe('Short 1:00 · Full 2:00');
  });

  it('names the one routine it is in', () => {
    expect(routineDurations(0, 836)).toBe('Full only');
    expect(routineDurations(90, 0)).toBe('Short only');
    expect(routineDurations(0, 0)).toBe('Not in a routine');
  });
});

describe('shareLabel', () => {
  it('labels timed, rep and untimed sub-steps', () => {
    expect(planSubSteps(byId('low-breathing'), 96, 8).map(shareLabel)).toEqual(['untimed', '0:25', '× 8']);
    expect(planSubSteps(byId('read-aloud'), 120).map(shareLabel)).toEqual(['1:00', '1:00', 'untimed']);
    expect(planSubSteps(byId('vfe'), 240).map(shareLabel)).toEqual(['× 2', '× 2', '× 2', '× 10']);
  });
});
