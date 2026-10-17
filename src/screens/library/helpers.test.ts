import { describe, expect, it } from 'vitest';
import { exercises } from '../../exercises';
import { planSubSteps } from '../../state/plan';
import { isLibraryHash, libraryIdFromHash, playsIn, routineDurations, shareLabel } from './helpers';

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

  it('names the one routine it is switched on in', () => {
    expect(routineDurations(undefined, 836)).toBe('Full only');
    expect(routineDurations(90, undefined)).toBe('Short only');
    expect(routineDurations(undefined, undefined)).toBe('Not in a routine');
  });
});

describe('playsIn', () => {
  it('names the routines the track is switched on in', () => {
    expect(playsIn(true, true)).toBe('Plays in both routines.');
    expect(playsIn(false, true)).toBe('Plays in the Full routine.');
    expect(playsIn(true, false)).toBe('Plays in the Short routine.');
    expect(playsIn(false, false)).toBe('Off in both routines. Turn it on in Settings.');
  });
});

describe('shareLabel', () => {
  it('labels timed, rep and untimed sub-steps', () => {
    expect(planSubSteps(byId('low-breathing'), 96, 8).map(shareLabel)).toEqual(['untimed', '× 8']);
    expect(planSubSteps(byId('straw'), 180).map(shareLabel)).toEqual(['untimed', '0:35', '1:15', '0:35', '0:35']);
    expect(planSubSteps(byId('read-aloud'), 120).map(shareLabel)).toEqual(['untimed', 'untimed']);
    expect(planSubSteps(byId('vfe'), 240).map(shareLabel)).toEqual(['× 2', '× 2', '× 2', '× 10']);
  });
});
