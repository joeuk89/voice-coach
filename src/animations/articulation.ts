import type { AnimationDef } from '../types';
import { pitchStrip } from './parts';

// Placeholder card: a bare pitch strip until the real animation lands. Phases follow the sub-step windows in exercises.ts.
const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  ${pitchStrip({ top: 96, bottom: 256, trace: false, dot: false })}
</svg>`;

export const articulation: AnimationDef = {
  id: 'articulation',
  cycleSec: 16,
  svg,
  phases: [
    { until: 0.25, caption: 'Massage the jaw muscles with your fingertips and let the jaw hang loose. Teeth apart, lips soft.' },
    { until: 0.5, caption: 'Yawn-sigh: yawn with the mouth wide, then sigh out on a gentle “hah” from high to low.' },
    { until: 0.75, caption: 'Tongue trill: a rolled “rrr” on one easy pitch. If it won’t go, fast “la-la-la” or “ttt-ddd” instead.' },
    { until: 1, caption: 'Tongue twisters, each twice: slow and over-articulated first, then at speaking pace.' },
  ],
};
