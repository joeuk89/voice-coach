import { describe, expect, it } from 'vitest';
import { exercises } from '../exercises';
import { isLast, nextPosition, prevPosition, type Position } from './position';

const exercise = (subStepCount: number) => ({ exercise: { subSteps: Array.from({ length: subStepCount }, () => ({})) } });
const steps = [exercise(3), exercise(0), exercise(2)];
const at = (index: number, subIndex: number): Position => ({ index, subIndex });

describe('nextPosition', () => {
  it('moves to the next sub-step within an exercise', () => {
    expect(nextPosition(steps, at(0, 0))).toEqual(at(0, 1));
    expect(nextPosition(steps, at(2, 0))).toEqual(at(2, 1));
  });

  it('moves from the last sub-step to the first sub-step of the next exercise', () => {
    expect(nextPosition(steps, at(0, 2))).toEqual(at(1, 0));
  });

  it('treats an exercise with no sub-steps as one position', () => {
    expect(nextPosition(steps, at(1, 0))).toEqual(at(2, 0));
  });

  it('returns null at the last sub-step of the last exercise', () => {
    expect(nextPosition(steps, at(2, 1))).toBeNull();
  });
});

describe('prevPosition', () => {
  it('moves to the previous sub-step within an exercise', () => {
    expect(prevPosition(steps, at(0, 2))).toEqual(at(0, 1));
  });

  it('moves from the first sub-step to the last sub-step of the previous exercise', () => {
    expect(prevPosition(steps, at(1, 0))).toEqual(at(0, 2));
  });

  it('lands on position 0 of an exercise with no sub-steps', () => {
    expect(prevPosition(steps, at(2, 0))).toEqual(at(1, 0));
  });

  it('returns null at the first sub-step of the first exercise', () => {
    expect(prevPosition(steps, at(0, 0))).toBeNull();
  });
});

describe('isLast', () => {
  it('is true only at the last sub-step of the last exercise', () => {
    expect(isLast(steps, at(2, 1))).toBe(true);
    expect(isLast(steps, at(2, 0))).toBe(false);
    expect(isLast(steps, at(0, 2))).toBe(false);
  });

  it('is true on a last exercise with no sub-steps', () => {
    expect(isLast([exercise(2), exercise(0)], at(1, 0))).toBe(true);
  });

  it('is true for a single exercise with a single position', () => {
    expect(isLast([exercise(0)], at(0, 0))).toBe(true);
    expect(prevPosition([exercise(0)], at(0, 0))).toBeNull();
  });
});

describe('walking the real routine', () => {
  const routine = exercises.map((e) => ({ exercise: e }));
  const total = routine.reduce((sum, s) => sum + Math.max(1, s.exercise.subSteps.length), 0);

  it('visits every position forward, then the same positions backward', () => {
    const forward: Position[] = [at(0, 0)];
    for (let p = nextPosition(routine, at(0, 0)); p; p = nextPosition(routine, p)) forward.push(p);
    expect(forward).toHaveLength(total);
    expect(isLast(routine, forward.at(-1)!)).toBe(true);

    const backward: Position[] = [forward.at(-1)!];
    for (let p = prevPosition(routine, backward[0]!); p; p = prevPosition(routine, p)) backward.push(p);
    expect(backward.reverse()).toEqual(forward);
  });
});
