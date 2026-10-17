import { describe, expect, it } from 'vitest';
import { exercises } from '../exercises';
import type { Exercise, SubStep } from '../types';
import { planSubSteps } from './plan';

function fixture(subSteps: SubStep[]): Exercise {
  return {
    id: 'fixture',
    name: 'Fixture',
    purpose: '',
    subSteps,
    duration: { short: 0, full: 0 },
    animation: null,
    links: [],
  };
}

const weighted = (...weights: number[]) => fixture(weights.map((weight) => ({ text: '', weight })));
const seconds = (ex: Exercise, total: number) => planSubSteps(ex, total).map((p) => p.seconds);

describe('planSubSteps', () => {
  it('splits evenly when every weight is the default', () => {
    const plan = planSubSteps(fixture([{ text: '' }, { text: '' }, { text: '' }]), 90);
    expect(plan.map((p) => p.seconds)).toEqual([30, 30, 30]);
    expect(plan.map((p) => p.mode)).toEqual(['timed', 'timed', 'timed']);
  });

  it('splits by weight', () => {
    expect(seconds(weighted(0, 1, 3), 120)).toEqual([0, 30, 90]);
    expect(seconds(weighted(0, 1, 2, 1), 90)).toEqual([0, 25, 45, 20]);
  });

  it('hands leftover 5-second units to the largest remainders, earliest first on a tie', () => {
    expect(seconds(weighted(1, 1, 0), 95)).toEqual([50, 45, 0]);
    expect(seconds(weighted(1, 1, 1, 1), 30)).toEqual([10, 10, 5, 5]);
    expect(seconds(weighted(1, 1, 2, 1), 180)).toEqual([35, 35, 75, 35]);
  });

  it('splits non-integer weights', () => {
    expect(seconds(weighted(0.5, 1.5), 60)).toEqual([15, 45]);
    expect(seconds(weighted(0.5, 0.5, 1), 50)).toEqual([15, 10, 25]);
  });

  it('derives reps from repSec', () => {
    const plan = planSubSteps(fixture([{ text: '', weight: 0 }, { text: '' }, { text: '', weight: 3, repSec: 12 }]), 120);
    expect(plan[2]).toMatchObject({ mode: 'reps', seconds: 90, reps: 8 });
  });

  it('never derives fewer than one rep', () => {
    expect(planSubSteps(fixture([{ text: '', repSec: 12 }]), 5)[0]).toMatchObject({ seconds: 5, reps: 1 });
  });

  it('keeps fixed reps and still gives each a time share', () => {
    const plan = planSubSteps(fixture([{ text: '', reps: 2 }, { text: '', reps: 10 }]), 120);
    expect(plan.map((p) => [p.mode, p.seconds, p.reps])).toEqual([
      ['reps', 60, 2],
      ['reps', 60, 10],
    ]);
  });

  it('treats weight 0 as untimed even with reps', () => {
    expect(planSubSteps(fixture([{ text: '', weight: 0, reps: 3 }, { text: '' }]), 60)[0]).toEqual({
      subStep: { text: '', weight: 0, reps: 3 },
      mode: 'untimed',
      seconds: 0,
    });
  });

  it('returns nothing for an empty list', () => {
    expect(planSubSteps(fixture([]), 60)).toEqual([]);
  });

  it('gives every sub-step zero seconds when all weights are 0', () => {
    const plan = planSubSteps(weighted(0, 0), 60);
    expect(plan.map((p) => [p.mode, p.seconds])).toEqual([
      ['untimed', 0],
      ['untimed', 0],
    ]);
  });

  it('fills every real exercise exactly, with at least 5 seconds per timed sub-step', () => {
    for (const exercise of exercises) {
      for (const total of Object.values(exercise.duration)) {
        if (total === 0 || exercise.subSteps.length === 0) continue;
        const plan = planSubSteps(exercise, total);
        expect(plan.reduce((sum, p) => sum + p.seconds, 0), exercise.id).toBe(total);
        for (const p of plan.filter((p) => p.mode !== 'untimed')) expect(p.seconds, exercise.id).toBeGreaterThanOrEqual(5);
      }
    }
  });
});
