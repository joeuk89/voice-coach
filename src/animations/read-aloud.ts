import type { AnimationDef } from '../types';
import './read-aloud.css';

const bigContour =
  'M36 140 C 70 140, 100 70, 130 70 C 150 70, 155 140, 168 140 C 180 140, 185 80, 203 80 C 220 80, 230 140, 245 140 C 262 140, 272 60, 297 60 C 312 60, 318 110, 326 130';
const softContour =
  'M36 140 C 70 140, 100 91, 130 91 C 150 91, 155 140, 168 140 C 180 140, 185 98, 203 98 C 220 98, 230 140, 245 140 C 262 140, 272 84, 297 84 C 312 84, 318 118, 326 132';

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <line class="pitch-axis" x1="36" y1="140" x2="326" y2="140"/>
  <g class="ra-pass ra-pass-1">
    <text class="anim-label" x="36" y="40">PASS 1 · OVER THE TOP</text>
    <path class="ra-line ra-line-1" pathLength="1" d="${bigContour}"/>
    <circle class="ra-dot ra-dot-1" r="6"/>
  </g>
  <g class="ra-pass ra-pass-2">
    <text class="anim-label" x="36" y="40">PASS 2 · 70 PERCENT</text>
    <path class="ra-line ra-line-2" pathLength="1" d="${softContour}"/>
    <circle class="ra-dot ra-dot-2" r="6"/>
  </g>

  <text class="ra-text" x="36" y="186">I didn’t <tspan class="hot">say</tspan> he <tspan class="hot">stole</tspan> the <tspan class="hot">money</tspan>.</text>
  <text class="anim-label" x="36" y="232">Bright words carry the pitch moves.</text>
</svg>`;

export const readAloud: AnimationDef = {
  id: 'read-aloud',
  cycleSec: 10,
  svg,
  phases: [
    { until: 0.5, caption: 'Read it once completely over the top. Exaggerate every rise and fall.' },
    { until: 1, caption: 'Read it again at 70 percent. Keep the movement, lose the parody.' },
  ],
};
