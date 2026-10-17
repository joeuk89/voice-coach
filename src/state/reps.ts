export interface RepLabel {
  lead: string;
  shown: number;
  tail: string;
}

export function isComplete(count: number, target: number): boolean {
  return count >= target;
}

/** Splits the label so the count can be drawn larger than the words around it. */
export function repLabel(count: number, target: number, noun: string, repsPerPitch?: number): RepLabel {
  if (isComplete(count, target)) return { lead: '', shown: target, tail: `of ${target}` };
  const pitch = repsPerPitch ? ` · pitch ${Math.floor(count / repsPerPitch) + 1}` : '';
  return { lead: noun, shown: count, tail: `of ${target}${pitch}` };
}
