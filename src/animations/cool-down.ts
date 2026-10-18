import type { AnimationDef } from '../types';
import { pitchStrip } from './parts';

// Placeholder card: a bare pitch strip until the real animation lands. Phases follow the sub-step windows in exercises.ts.
const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  ${pitchStrip({ top: 96, bottom: 256, trace: false, dot: false })}
</svg>`;

export const coolDown: AnimationDef = {
  id: 'cool-down',
  cycleSec: 12,
  svg,
  phases: [
    { until: 0.75, caption: 'Straw or loose lips: gentle hums sliding down from the middle of your range, each one softer than the last.' },
    { until: 1, caption: 'Swallow, let the shoulders drop, and say one easy sentence in your everyday voice.' },
  ],
};
