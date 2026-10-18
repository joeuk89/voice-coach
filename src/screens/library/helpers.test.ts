import { describe, expect, it } from 'vitest';
import { exercises } from '../../exercises';
import { planSubSteps } from '../../state/plan';
import type { Weekday } from '../../types';
import { isLibraryHash, libraryIdFromHash, routineDurations, scheduleSentence, shareLabel } from './helpers';

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
  const everyDay = [0, 1, 2, 3, 4, 5, 6] as const;
  const mwf = [1, 3, 5] as const;

  it('shows both routines when the exercise is in both', () => {
    expect(routineDurations({ short: { seconds: 60, days: everyDay }, full: { seconds: 120, days: everyDay } })).toBe(
      'Short 1:00 · Full 2:00',
    );
  });

  it('adds the days to a routine that does not run it every day', () => {
    expect(routineDurations({ short: { seconds: 240, days: mwf }, full: { seconds: 240, days: everyDay } })).toBe(
      'Short 4:00 Mon, Wed, Fri · Full 4:00',
    );
    expect(routineDurations({ short: { seconds: 60, days: [0, 6] }, full: { seconds: 90, days: [2] } })).toBe(
      'Short 1:00 Sat, Sun · Full 1:30 Tue',
    );
  });

  it('names the one routine it is switched on in, with its days', () => {
    expect(routineDurations({ full: { seconds: 836, days: everyDay } })).toBe('Full only');
    expect(routineDurations({ short: { seconds: 90, days: everyDay }, full: undefined })).toBe('Short only');
    expect(routineDurations({ short: { seconds: 90, days: mwf } })).toBe('Short only · Mon, Wed, Fri');
    expect(routineDurations({})).toBe('Not in a routine');
  });
});

describe('scheduleSentence', () => {
  const everyDay = [0, 1, 2, 3, 4, 5, 6] as const;
  const slot = (days: readonly Weekday[]) => ({ seconds: 60, days });

  it('says nothing when the exercise runs every day wherever it is on', () => {
    expect(scheduleSentence({ short: slot(everyDay), full: slot(everyDay) })).toBe('');
    expect(scheduleSentence({ full: slot(everyDay) })).toBe('');
    expect(scheduleSentence({})).toBe('');
  });

  it('names the days in each routine it is in', () => {
    expect(scheduleSentence({ short: slot([1, 3, 5]) })).toBe('Runs Mon, Wed and Fri in Short.');
    expect(scheduleSentence({ short: slot([1, 3, 5]), full: slot(everyDay) })).toBe(
      'Runs Mon, Wed and Fri in Short and every day in Full.',
    );
    expect(scheduleSentence({ short: slot(everyDay), full: slot([0, 6]) })).toBe('Runs every day in Short and Sat and Sun in Full.');
  });

  it('shares a clause when both routines have the same days', () => {
    expect(scheduleSentence({ short: slot([2, 4]), full: slot([4, 2]) })).toBe('Runs Tue and Thu in Short and Full.');
  });
});

describe('shareLabel', () => {
  it('labels timed, rep and untimed sub-steps', () => {
    expect(planSubSteps(byId('low-breathing'), 96, 8).map(shareLabel)).toEqual(['untimed', '× 8']);
    expect(planSubSteps(byId('straw'), 180).map(shareLabel)).toEqual(['untimed', '1:00', '2:00', '× 3', 'untimed']);
    expect(planSubSteps(byId('straw'), 90).map(shareLabel)).toEqual(['untimed', '0:30', '1:00', '× 3', 'untimed']);
    expect(planSubSteps(byId('lip-trills'), 180).map(shareLabel)).toEqual(['0:45', '0:45', '1:30', 'untimed', 'untimed']);
    expect(planSubSteps(byId('read-aloud'), 180).map(shareLabel)).toEqual(['untimed', 'untimed', 'untimed', 'untimed']);
    expect(planSubSteps(byId('vfe'), 240).map(shareLabel)).toEqual(['× 2', '× 2', '× 2', '× 10']);
  });
});
