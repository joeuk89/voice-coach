import type { AnimationDef } from '../types';
import { pitchStrip } from './parts';

// Placeholder card: a bare pitch strip until the real animation lands. Phases follow the sub-step windows in exercises.ts.
const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  ${pitchStrip({ top: 96, bottom: 256, trace: false, dot: false })}
</svg>`;

export const dynamics: AnimationDef = {
  id: 'dynamics',
  cycleSec: 16,
  svg,
  phases: [
    { until: 0.5, caption: 'Hum or “ah” on an easy mid pitch. Swell from quiet to speaking-loud and back to quiet over about 8 seconds.' },
    { until: 0.75, caption: 'Count 1 to 10 getting steadily louder on breath alone, then 10 to 1 getting quieter. Twice.' },
    { until: 1, caption: 'Call a short phrase across the room on a fresh low breath, then say it at normal volume with the same open throat.' },
  ],
};
