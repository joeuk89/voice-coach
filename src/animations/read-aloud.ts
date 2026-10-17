import type { AnimationDef } from '../types';
import './read-aloud.css';

const base = 160;

/** Peaks sit over the bold words: “say” at x 110, “stole” at 174, “money” at 258. `scale` shrinks every rise for pass 2. */
function contour(scale: number): string {
  const peak = (height: number) => Math.round(base - height * scale);
  return [
    `M36 ${base} C 70 ${base}, 86 ${peak(86)}, 110 ${peak(86)}`,
    `C 128 ${peak(86)}, 132 ${base}, 142 ${base}`,
    `C 152 ${base}, 158 ${peak(76)}, 174 ${peak(76)}`,
    `C 192 ${peak(76)}, 198 ${base}, 214 ${base}`,
    `C 230 ${base}, 238 ${peak(96)}, 258 ${peak(96)}`,
    `C 282 ${peak(96)}, 304 ${peak(30)}, 326 ${peak(16)}`,
  ].join(' ');
}

const bigContour = contour(1);
const softContour = contour(0.7);

const svg = `
<svg viewBox="0 0 360 290" aria-hidden="true">
  <line class="pitch-axis" x1="36" y1="${base}" x2="326" y2="${base}"/>
  <g class="ra-pass ra-pass-1">
    <text class="anim-label" x="36" y="36">PASS 1 · OVER THE TOP</text>
    <path class="ra-line ra-line-1" pathLength="1" d="${bigContour}"/>
    <circle class="pitch-dot ra-dot ra-dot-1" r="6" style="offset-path: path('${bigContour}')"/>
  </g>
  <g class="ra-pass ra-pass-2">
    <text class="anim-label" x="36" y="36">PASS 2 · 70 PERCENT</text>
    <path class="ra-ghost" d="${bigContour}"/>
    <path class="ra-line ra-line-2" pathLength="1" d="${softContour}"/>
    <circle class="pitch-dot ra-dot ra-dot-2" r="6" style="offset-path: path('${softContour}')"/>
  </g>

  <text class="ra-text" x="36" y="206">I didn’t <tspan class="hot">say</tspan> he <tspan class="hot">stole</tspan> the <tspan class="hot">money</tspan>.</text>
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
