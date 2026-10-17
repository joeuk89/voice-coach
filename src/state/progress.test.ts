import { describe, expect, it } from 'vitest';
import { createProgress, exerciseState, finishStep, isStepFinished } from './progress';

describe('routine progress', () => {
  it('finishes a sub-step without finishing the exercise until the last one', () => {
    const p = createProgress();
    finishStep(p, 0, 0, 2);
    finishStep(p, 0, 1, 2);
    expect([0, 1, 2].map((i) => isStepFinished(p, 0, i))).toEqual([true, true, false]);
    expect(p.exercises.has(0)).toBe(false);
    finishStep(p, 0, 2, 2);
    expect(p.exercises.has(0)).toBe(true);
  });

  it('treats an exercise with one position as finished when that position finishes', () => {
    const p = createProgress();
    finishStep(p, 4, 0, 0);
    expect(p.exercises.has(4)).toBe(true);
  });

  it('keeps each exercise’s finished sub-steps apart for the whole session', () => {
    const p = createProgress();
    finishStep(p, 0, 1, 2);
    finishStep(p, 3, 0, 1);
    expect(isStepFinished(p, 0, 1)).toBe(true);
    expect(isStepFinished(p, 3, 1)).toBe(false);
    expect(isStepFinished(p, 3, 0)).toBe(true);
  });

  it('marks finished exercises done, whatever their order, including the current one', () => {
    const p = createProgress();
    finishStep(p, 5, 0, 0);
    expect([0, 2, 5, 6].map((i) => exerciseState(p, i, 2))).toEqual(['upcoming', 'current', 'done', 'upcoming']);
    finishStep(p, 2, 0, 0);
    expect(exerciseState(p, 2, 2)).toBe('done');
  });
});
