export interface Position {
  index: number;
  subIndex: number;
}

type Steps = readonly { exercise: { subSteps: readonly unknown[] } }[];

/** An exercise with no sub-steps, like the audio track, still counts as one position. */
function positionsIn(steps: Steps, index: number): number {
  return Math.max(1, steps[index]?.exercise.subSteps.length ?? 0);
}

export function nextPosition(steps: Steps, pos: Position): Position | null {
  if (pos.subIndex + 1 < positionsIn(steps, pos.index)) return { index: pos.index, subIndex: pos.subIndex + 1 };
  if (pos.index + 1 < steps.length) return { index: pos.index + 1, subIndex: 0 };
  return null;
}

export function prevPosition(steps: Steps, pos: Position): Position | null {
  if (pos.subIndex > 0) return { index: pos.index, subIndex: pos.subIndex - 1 };
  if (pos.index > 0) return { index: pos.index - 1, subIndex: positionsIn(steps, pos.index - 1) - 1 };
  return null;
}

export function isLast(steps: Steps, pos: Position): boolean {
  return nextPosition(steps, pos) === null;
}
