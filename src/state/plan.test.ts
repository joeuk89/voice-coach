import { describe, expect, it } from 'vitest';
import { exercises } from '../exercises';
import type { Exercise, SubStep } from '../types';
import { planSubSteps } from './plan';

const base = { id: 'fixture', name: 'Fixture', purpose: '', animation: null, links: [] };

function fixture(subSteps: SubStep[]): Exercise {
  return { ...base, subSteps, duration: { short: 0, full: 0 } };
}

function repsFixture(subSteps: SubStep[]): Exercise {
  return { ...base, subSteps, control: 'reps', reps: { short: 0, full: 0 }, repSec: 12, repNoun: 'rep' };
}

const byId = (id: string) => exercises.find((e) => e.id === id)!;
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

  it('gives a fixed-rep sub-step no time share, so the timed sub-steps split the whole time', () => {
    const plan = planSubSteps(fixture([{ text: '' }, { text: '', reps: 5 }, { text: '', reps: 10 }]), 120);
    expect(plan.map((p) => [p.mode, p.seconds, p.reps])).toEqual([
      ['timed', 120, undefined],
      ['reps', 0, 5],
      ['reps', 0, 10],
    ]);
  });

  it('gives a fixed-rep sub-step a time share when it sets a weight', () => {
    const plan = planSubSteps(fixture([{ text: '' }, { text: '', weight: 1, reps: 2 }]), 120);
    expect(plan.map((p) => [p.mode, p.seconds, p.reps])).toEqual([
      ['timed', 60, undefined],
      ['reps', 60, 2],
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

  it('gives a counted sub-step on a reps exercise the exercise rep count', () => {
    const plan = planSubSteps(repsFixture([{ text: '' }, { text: '', weight: 3, repSec: 12 }]), 60, 3);
    expect(plan.map((p) => [p.mode, p.reps])).toEqual([
      ['timed', undefined],
      ['reps', 3],
    ]);
  });

  it('keeps a sub-step fixed rep count and weight 0 on a reps exercise', () => {
    const plan = planSubSteps(repsFixture([{ text: '', reps: 2 }, { text: '', weight: 0, repSec: 12 }]), 60, 7);
    expect(plan.map((p) => [p.mode, p.reps])).toEqual([
      ['reps', 2],
      ['untimed', undefined],
    ]);
  });

  it('ignores a rep count on an exercise that is not counted in reps', () => {
    expect(planSubSteps(fixture([{ text: '', weight: 3, repSec: 12 }]), 120, 3)[0]).toMatchObject({ reps: 10 });
  });

  it('counts low breathing in the routine rep count', () => {
    expect(planSubSteps(byId('low-breathing'), 96, 8).map((p) => [p.mode, p.reps])).toEqual([
      ['untimed', undefined],
      ['reps', 8],
    ]);
    expect(planSubSteps(byId('low-breathing'), 60, 5).map((p) => [p.mode, p.reps])).toEqual([
      ['untimed', undefined],
      ['reps', 5],
    ]);
  });

  it('counts hum steps 2 to 4 in fives and gives step 1 the whole time', () => {
    for (const total of [120, 60]) {
      expect(planSubSteps(byId('hum'), total).map((p) => [p.mode, p.seconds, p.reps])).toEqual([
        ['timed', total, undefined],
        ['reps', 0, 5],
        ['reps', 0, 5],
        ['reps', 0, 5],
      ]);
    }
  });

  it('leaves the vocal function exercises time unallocated, since every step is a fixed count', () => {
    expect(planSubSteps(byId('vfe'), 240).map((p) => [p.mode, p.seconds, p.reps])).toEqual([
      ['reps', 0, 2],
      ['reps', 0, 2],
      ['reps', 0, 2],
      ['reps', 0, 10],
    ]);
  });

  it('fills every real exercise exactly, with at least 5 seconds per sub-step that takes a share', () => {
    const takesShare = (s: SubStep) => (s.weight ?? (s.reps === undefined ? 1 : 0)) > 0;
    for (const exercise of exercises) {
      if (exercise.control === 'reps' || !exercise.subSteps.some(takesShare)) continue;
      for (const total of Object.values(exercise.duration)) {
        if (total === 0) continue;
        const plan = planSubSteps(exercise, total);
        expect(plan.reduce((sum, p) => sum + p.seconds, 0), exercise.id).toBe(total);
        for (const p of plan.filter((p) => takesShare(p.subStep))) expect(p.seconds, exercise.id).toBeGreaterThanOrEqual(5);
      }
    }
  });
});
